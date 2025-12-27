package com.smartwaste.service;

import com.smartwaste.dto.AdminWasteRequestDTO;
import com.smartwaste.entity.Collector;
import com.smartwaste.entity.RewardTransaction;
import com.smartwaste.entity.User;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.entity.WasteRequestStatus;
import com.smartwaste.entity.Zone;
import com.smartwaste.repository.CollectorRepository;
import com.smartwaste.repository.RewardTransactionRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.repository.WasteRequestRepository;
import com.smartwaste.repository.ZoneRepository;
import com.smartwaste.utils.FileUploadUtil;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

@Service
public class WasteRequestService {

	private final WasteRequestRepository wasteRequestRepository;
	private final UserRepository userRepository;
	private final RewardTransactionRepository rewardTransactionRepository;
	private final CollectorRepository collectorRepository;
	private final ZoneRepository zoneRepository;

	public WasteRequestService(
		WasteRequestRepository wasteRequestRepository,
		UserRepository userRepository,
		RewardTransactionRepository rewardTransactionRepository,
		CollectorRepository collectorRepository,
		ZoneRepository zoneRepository
	) {
		this.wasteRequestRepository = wasteRequestRepository;
		this.userRepository = userRepository;
		this.rewardTransactionRepository = rewardTransactionRepository;
		this.collectorRepository = collectorRepository;
		this.zoneRepository = zoneRepository;
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
		// All new requests start in CREATED state in the strict lifecycle,
		// but we persist the legacy String value to avoid breaking existing APIs/UI.
		request.setStatus(WasteRequestStatus.CREATED.toLegacyString());
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

	/**
	 * Admin-only: get all waste requests (for monitoring/assignment UI).
	 */
	public List<WasteRequest> getAllRequests() {
		return wasteRequestRepository.findAll();
	}

	/**
	 * Admin-only: get all waste requests with enriched data (user, collector, zone info).
	 */
	public List<AdminWasteRequestDTO> getAllRequestsEnriched() {
		return wasteRequestRepository.findAll().stream()
			.map(this::enrichRequest)
			.collect(Collectors.toList());
	}

	/**
	 * Enrich a waste request with user, collector, and zone information.
	 * Public method to allow controllers to enrich requests after updates.
	 */
	public AdminWasteRequestDTO enrichRequest(WasteRequest request) {
		AdminWasteRequestDTO dto = new AdminWasteRequestDTO();
		dto.setRequestId(request.getRequestId());
		dto.setUserId(request.getUserId());
		dto.setCollectorId(request.getCollectorId());
		dto.setZoneId(request.getZoneId());
		dto.setWasteType(request.getWasteType());
		dto.setWeightKg(request.getWeightKg());
		dto.setStatus(request.getStatus());
		dto.setPickupAddress(request.getPickupAddress());
		dto.setScheduledTime(request.getScheduledTime());
		dto.setCollectedTime(request.getCollectedTime());
		dto.setRewardPoints(request.getRewardPoints());
		dto.setImageUrl(request.getImageUrl());
		dto.setCollectorProofUrl(request.getCollectorProofUrl());
		dto.setCreatedAt(request.getCreatedAt());

		// Enrich with user information
		if (request.getUserId() != null) {
			userRepository.findById(request.getUserId()).ifPresent(user -> {
				dto.setUserName(user.getName());
				dto.setUserEmail(user.getEmail());
			});
		}

		// Enrich with collector information
		if (request.getCollectorId() != null) {
			collectorRepository.findById(request.getCollectorId()).ifPresent(collector -> {
				dto.setCollectorName(collector.getName());
			});
		}

		// Enrich with zone information
		if (request.getZoneId() != null) {
			zoneRepository.findById(request.getZoneId()).ifPresent(zone -> {
				dto.setZoneName(zone.getZoneName());
			});
		}

		// Set display status: UNASSIGNED if no collector, ASSIGNED if collector exists
		WasteRequestStatus status = WasteRequestStatus.fromString(request.getStatus());
		if (request.getCollectorId() == null || status == WasteRequestStatus.CREATED) {
			dto.setDisplayStatus("UNASSIGNED");
		} else {
			dto.setDisplayStatus("ASSIGNED");
		}

		return dto;
	}

	public List<WasteRequest> getRequestsForCollector(Long collectorId) {
		return wasteRequestRepository.findByCollectorId(collectorId);
	}

	/**
	 * Identify requests that are still in early/mid lifecycle for longer than the given hours.
	 * Visual-only flagging; does not mutate state.
	 */
	public List<WasteRequest> getDelayedRequests(long hoursThreshold) {
		LocalDateTime cutoff = LocalDateTime.now().minus(hoursThreshold, ChronoUnit.HOURS);
		return wasteRequestRepository.findAll().stream()
			.filter(req -> {
				WasteRequestStatus status = WasteRequestStatus.fromString(req.getStatus());
				boolean inEarly = status == WasteRequestStatus.CREATED || status == WasteRequestStatus.ASSIGNED || status == WasteRequestStatus.IN_PROGRESS;
				return inEarly && req.getCreatedAt() != null && req.getCreatedAt().isBefore(cutoff);
			})
			.toList();
	}

	/**
	 * Admin-only: assign or reassign a collector for a request. Collector must exist.
	 * Only allows assignment of UNASSIGNED requests (status CREATED or no collector assigned).
	 * Does not allow status changes to COLLECTED/CLOSED.
	 */
	public WasteRequest reassignCollector(Long requestId, Long newCollectorId, User actingUser) {
		if (!"ADMIN".equals(actingUser.getRole())) {
			throw new AccessDeniedException("Only admins can assign collectors");
		}

		WasteRequest request = wasteRequestRepository.findById(requestId)
			.orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

		if (newCollectorId == null) {
			throw new IllegalArgumentException("collectorId is required");
		}

		collectorRepository.findById(newCollectorId)
			.orElseThrow(() -> new IllegalArgumentException("Collector not found: " + newCollectorId));

		WasteRequestStatus status = WasteRequestStatus.fromString(request.getStatus());
		
		// Prevent assignment of completed/closed requests
		if (status == WasteRequestStatus.COLLECTED || status == WasteRequestStatus.CLOSED) {
			throw new IllegalArgumentException("Cannot assign a completed/closed request");
		}

		// Only allow assignment if request is UNASSIGNED (no collector or status is CREATED)
		// Allow reassignment if already ASSIGNED but not yet IN_PROGRESS
		boolean isUnassigned = request.getCollectorId() == null || status == WasteRequestStatus.CREATED;
		boolean isAssignedButNotStarted = status == WasteRequestStatus.ASSIGNED;
		
		if (!isUnassigned && !isAssignedButNotStarted) {
			throw new IllegalArgumentException("Can only assign UNASSIGNED requests or reassign ASSIGNED requests that haven't started");
		}

		request.setCollectorId(newCollectorId);

		// If request was still in CREATED (UNASSIGNED), set status to ASSIGNED
		if (status == WasteRequestStatus.CREATED) {
			request.setStatus(WasteRequestStatus.ASSIGNED.toLegacyString());
		}

		return wasteRequestRepository.save(request);
	}

	public WasteRequest updateStatus(
		Long requestId,
		String newStatus,
		MultipartFile proofFile,
		User actingUser
	) throws IOException {
		WasteRequest request = wasteRequestRepository.findById(requestId)
			.orElseThrow(() -> new IllegalArgumentException("Request not found: " + requestId));

		WasteRequestStatus currentStatus = WasteRequestStatus.fromString(request.getStatus());
		WasteRequestStatus targetStatus = WasteRequestStatus.fromString(newStatus);

		validateActorCanModifyRequest(actingUser, request, currentStatus, targetStatus);

		// Persist as legacy String to keep external API/UI behavior unchanged
		request.setStatus(targetStatus.toLegacyString());

		if (proofFile != null && !proofFile.isEmpty()) {
			String proofPath = FileUploadUtil.saveFile("uploads/proof", proofFile);
			request.setCollectorProofUrl(proofPath);
		}

		// Reward trigger: only when a collector legitimately moves IN_PROGRESS -> COLLECTED
		if (currentStatus == WasteRequestStatus.IN_PROGRESS && targetStatus == WasteRequestStatus.COLLECTED) {
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

		// Only the assigned collector (or admin) can upload proof; does not change status itself
		validateActorCanUploadProof(actingUser, request);

		String proofPath = FileUploadUtil.saveFile("uploads/proof", proofFile);
		request.setCollectorProofUrl(proofPath);
		return wasteRequestRepository.save(request);
	}

	private void applyRewards(WasteRequest request) {
		// Prevent duplicate rewards: check if reward transaction already exists for this request
		if (rewardTransactionRepository.findByRequestId(request.getRequestId()).isPresent()) {
			return;
		}

		// Calculate points based on waste type multiplier
		int pointsAwarded = calculatePoints(request.getWasteType());
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
		transaction.setRequestId(request.getRequestId());
		transaction.setPointsAdded(pointsAwarded);
		transaction.setPointsSpent(0);
		transaction.setTransactionType("ADD");
		transaction.setDescription("Waste request #" + request.getRequestId() + " (" + request.getWasteType() + ") collected - " + pointsAwarded + " points");
		rewardTransactionRepository.save(transaction);
	}

	/**
	 * Calculate reward points based on waste type multipliers.
	 * Base Points = 10
	 * Multipliers:
	 * - DRY (PLASTIC, METAL, PAPER) → 1.0
	 * - WET (ORGANIC) → 1.2
	 * - E_WASTE → 2.0
	 * - HAZARDOUS → 3.0
	 * Final Points = Base Points × Multiplier
	 */
	private int calculatePoints(String wasteType) {
		if (wasteType == null || wasteType.trim().isEmpty()) {
			return 0;
		}

		String normalizedType = wasteType.trim().toUpperCase();
		String category = mapWasteTypeToCategory(normalizedType);
		
		double multiplier;
		switch (category) {
			case "DRY":
				multiplier = 1.0;
				break;
			case "WET":
				multiplier = 1.2;
				break;
			case "E_WASTE":
				multiplier = 2.0;
				break;
			case "HAZARDOUS":
				multiplier = 3.0;
				break;
			default:
				// Default to DRY multiplier if unknown type
				multiplier = 1.0;
				break;
		}

		int basePoints = 10;
		return (int) Math.round(basePoints * multiplier);
	}

	/**
	 * Map database waste types to reward categories.
	 * PLASTIC, METAL, PAPER → DRY
	 * ORGANIC → WET
	 * E_WASTE → E_WASTE
	 * Unknown types default to DRY
	 */
	private String mapWasteTypeToCategory(String wasteType) {
		if (wasteType == null) {
			return "DRY";
		}

		String normalized = wasteType.trim().toUpperCase();
		switch (normalized) {
			case "PLASTIC":
			case "METAL":
			case "PAPER":
				return "DRY";
			case "ORGANIC":
				return "WET";
			case "E_WASTE":
				return "E_WASTE";
			case "HAZARDOUS":
				return "HAZARDOUS";
			default:
				// Default to DRY for unknown types
				return "DRY";
		}
	}

	/**
	 * Enforce who can move between which lifecycle states.
	 *
	 * - USER: cannot modify status after creation (read-only).
	 * - ADMIN: cannot directly mark requests as COLLECTED; in this phase, admins monitor only.
	 * - COLLECTOR: can move ASSIGNED/CREATED -> IN_PROGRESS -> COLLECTED/CLOSED for their own assigned requests.
	 */
	private void validateActorCanModifyRequest(
		User actor,
		WasteRequest request,
		WasteRequestStatus currentStatus,
		WasteRequestStatus targetStatus
	) {
		String role = actor.getRole();

		if ("USER".equals(role)) {
			// Users can only view their requests; no status changes allowed
			throw new AccessDeniedException("Users cannot modify request status");
		}

		if ("ADMIN".equals(role)) {
			// Admins can monitor but not change lifecycle in this phase
			throw new AccessDeniedException("Admins cannot change request status in this phase");
		}

		if ("COLLECTOR".equals(role)) {
			Collector collector = collectorRepository.findByEmail(actor.getEmail())
				.orElseThrow(() -> new AccessDeniedException("Collector profile not found"));

			if (request.getCollectorId() == null || !request.getCollectorId().equals(collector.getCollectorId())) {
				throw new AccessDeniedException("Request is not assigned to this collector");
			}

			// Prevent collectors from modifying already completed/closed requests
			if (currentStatus == WasteRequestStatus.COLLECTED || currentStatus == WasteRequestStatus.CLOSED) {
				throw new IllegalArgumentException("Cannot modify a completed or closed request");
			}

			// Allowed collector transitions:
			// - ASSIGNED or CREATED -> IN_PROGRESS (start work)
			// - IN_PROGRESS -> COLLECTED (successful completion)
			// - IN_PROGRESS -> CLOSED (rejected/cancelled)
			boolean allowed =
				((currentStatus == WasteRequestStatus.ASSIGNED || currentStatus == WasteRequestStatus.CREATED) &&
					targetStatus == WasteRequestStatus.IN_PROGRESS) ||
				(currentStatus == WasteRequestStatus.IN_PROGRESS && targetStatus == WasteRequestStatus.COLLECTED) ||
				(currentStatus == WasteRequestStatus.IN_PROGRESS && targetStatus == WasteRequestStatus.CLOSED);

			if (!allowed) {
				throw new IllegalArgumentException(
					"Invalid status transition for collector: " + currentStatus + " -> " + targetStatus
				);
			}

			return;
		}

		throw new AccessDeniedException("Unknown role: " + role);
	}

	private void validateActorCanUploadProof(User actor, WasteRequest request) {
		String role = actor.getRole();

		if ("ADMIN".equals(role)) {
			// Admins can upload proof only for audit/monitoring purposes
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

		throw new AccessDeniedException("Only collectors or admins can upload proof");
	}
}
