package com.smartwaste.service;

import com.smartwaste.entity.Collector;
import com.smartwaste.entity.RewardTransaction;
import com.smartwaste.entity.User;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.repository.CollectorRepository;
import com.smartwaste.repository.RewardTransactionRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.repository.WasteRequestRepository;
import com.smartwaste.utils.FileUploadUtil;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class WasteRequestService {

	private static final Map<String, String> STATUS_ALIASES = Map.of(
		"INPROGRESS", "IN_PROGRESS",
		"IN_PROGRESS", "IN_PROGRESS",
		"PENDING", "PENDING",
		"COLLECTED", "COLLECTED",
		"REJECTED", "REJECTED"
	);

	private final WasteRequestRepository wasteRequestRepository;
	private final UserRepository userRepository;
	private final RewardTransactionRepository rewardTransactionRepository;
	private final CollectorRepository collectorRepository;

	public WasteRequestService(
		WasteRequestRepository wasteRequestRepository,
		UserRepository userRepository,
		RewardTransactionRepository rewardTransactionRepository,
		CollectorRepository collectorRepository
	) {
		this.wasteRequestRepository = wasteRequestRepository;
		this.userRepository = userRepository;
		this.rewardTransactionRepository = rewardTransactionRepository;
		this.collectorRepository = collectorRepository;
	}

	public WasteRequest createRequest(
		Long userId,
		Long zoneId,
		String wasteType,
		double weight,
		String address,
		MultipartFile file
	) throws IOException {
		if (userId == null) {
			throw new IllegalArgumentException("userId is required");
		}
		if (zoneId == null) {
			throw new IllegalArgumentException("zoneId is required");
		}
		if (weight < 0) {
			throw new IllegalArgumentException("weight cannot be negative");
		}
		if (address == null || address.isBlank()) {
			throw new IllegalArgumentException("pickup address is required");
		}

		WasteRequest request = new WasteRequest();
		request.setUserId(userId);
		request.setZoneId(zoneId);
		request.setWasteType(wasteType);
		request.setWeightKg(weight);
		request.setPickupAddress(address);
		request.setStatus("PENDING");
		request.setRewardPoints(0);

		if (file != null && !file.isEmpty()) {
			String savedPath = FileUploadUtil.saveFile("uploads/user", file);
			request.setImageUrl(savedPath);
		}

		return wasteRequestRepository.save(request);
	}

	public List<WasteRequest> getRequestsByUser(Long userId) {
		return wasteRequestRepository.findByUserId(userId);
	}

	public List<WasteRequest> getRequestsForCollector(Long collectorId) {
		return wasteRequestRepository.findByCollectorId(collectorId);
	}

	public WasteRequest updateStatus(
		Long requestId,
		String newStatus,
		MultipartFile proofFile,
		User actingUser
	) throws IOException {
		WasteRequest request = wasteRequestRepository.findById(requestId)
			.orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

		String previousStatus = request.getStatus();

		validateActorCanModifyRequest(actingUser, request);

		String normalizedStatus = normalizeStatus(newStatus);
		request.setStatus(normalizedStatus);

		if (proofFile != null && !proofFile.isEmpty()) {
			String proofPath = FileUploadUtil.saveFile("uploads/proof", proofFile);
			request.setCollectorProofUrl(proofPath);
		}

		if ("COLLECTED".equals(normalizedStatus) && !"COLLECTED".equalsIgnoreCase(previousStatus)) {
			request.setCollectedTime(LocalDateTime.now());
			applyRewards(request);
		}

		return wasteRequestRepository.save(request);
	}

	public WasteRequest uploadCollectorProof(Long requestId, MultipartFile proofFile, User actingUser)
		throws IOException {
		if (proofFile == null || proofFile.isEmpty()) {
			throw new IllegalArgumentException("Proof file is required");
		}
		WasteRequest request = wasteRequestRepository.findById(requestId)
			.orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

		validateActorCanModifyRequest(actingUser, request);

		String proofPath = FileUploadUtil.saveFile("uploads/proof", proofFile);
		request.setCollectorProofUrl(proofPath);
		return wasteRequestRepository.save(request);
	}

	private void applyRewards(WasteRequest request) {
		int pointsAwarded = calculatePoints(request.getWeightKg());
		request.setRewardPoints(pointsAwarded);

		if (pointsAwarded <= 0) {
			return;
		}

		User user = userRepository.findById(request.getUserId())
			.orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUserId()));

		user.setPoints(user.getPoints() + pointsAwarded);
		userRepository.save(user);

		RewardTransaction transaction = new RewardTransaction();
		transaction.setUser(user);
		transaction.setPointsAdded(pointsAwarded);
		transaction.setPointsSpent(0);
		transaction.setTransactionType("ADD");
		transaction.setDescription("Waste request #" + request.getRequestId() + " collected");
		rewardTransactionRepository.save(transaction);
	}

	private int calculatePoints(double weightKg) {
		if (weightKg < 1) {
			return 0;
		}
		return (int) Math.round(weightKg * 10);
	}

	private String normalizeStatus(String status) {
		if (status == null) {
			throw new IllegalArgumentException("Status cannot be null");
		}
		String key = status.trim().toUpperCase();
		String normalized = STATUS_ALIASES.getOrDefault(key, key);
		if (!Set.of("PENDING", "IN_PROGRESS", "COLLECTED", "REJECTED").contains(normalized)) {
			throw new IllegalArgumentException("Unsupported status value: " + status);
		}
		return normalized;
	}

	private void validateActorCanModifyRequest(User actor, WasteRequest request) {
		String role = actor.getRole();
		if ("ADMIN".equals(role)) {
			return;
		}
		if ("USER".equals(role)) {
			if (!request.getUserId().equals(actor.getUserId())) {
				throw new AccessDeniedException("Users can only update their own requests");
			}
			return;
		}
		if ("COLLECTOR".equals(role)) {
			Collector collector = collectorRepository.findByEmail(actor.getEmail())
				.orElseThrow(() -> new AccessDeniedException("Collector profile not found"));
			if (request.getCollectorId() == null || !request.getCollectorId().equals(collector.getCollectorId())) {
				throw new AccessDeniedException("Request is not assigned to this collector");
			}
			return;
		}
		throw new AccessDeniedException("Unknown role: " + role);
	}
}
