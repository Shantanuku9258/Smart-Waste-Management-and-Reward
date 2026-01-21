package com.smartwaste.controller;

import com.smartwaste.entity.Collector;
import com.smartwaste.entity.User;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.repository.CollectorRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.service.WasteRequestService;
import java.io.IOException;
import java.security.Principal;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/requests")
@CrossOrigin
public class WasteRequestController {

	private final WasteRequestService wasteRequestService;
	private final UserRepository userRepository;
	private final CollectorRepository collectorRepository;

	public WasteRequestController(
		WasteRequestService wasteRequestService,
		UserRepository userRepository,
		CollectorRepository collectorRepository
	) {
		this.wasteRequestService = wasteRequestService;
		this.userRepository = userRepository;
		this.collectorRepository = collectorRepository;
	}

	@PostMapping(value = "/create", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<WasteRequest> create(
		@RequestParam(required = false) Long userId,
		@RequestParam Long zoneId,
		@RequestParam String wasteType,
		@RequestParam double weightKg,
		@RequestParam String pickupAddress,
		@RequestParam(required = false) MultipartFile image,
		Principal principal
	) throws IOException {
		Long resolvedUserId = resolveUserId(userId, principal);
		WasteRequest created = wasteRequestService.createRequest(
			resolvedUserId,
			zoneId,
			wasteType,
			weightKg,
			pickupAddress,
			image
		);
		return ResponseEntity.status(HttpStatus.CREATED).body(created);
	}

	@GetMapping("/user/{userId}")
	public ResponseEntity<List<WasteRequest>> getUserRequests(@PathVariable Long userId, Principal principal) {
		Long resolvedUserId = resolveUserId(userId, principal);
		return ResponseEntity.ok(wasteRequestService.getRequestsByUser(resolvedUserId));
	}

	@GetMapping("/me")
	public ResponseEntity<List<WasteRequest>> getMyRequests(Principal principal) {
		Long resolvedUserId = resolveUserId(null, principal);
		return ResponseEntity.ok(wasteRequestService.getRequestsByUser(resolvedUserId));
	}

	@GetMapping("/collector/{collectorId}")
	public ResponseEntity<List<WasteRequest>> getCollectorRequests(
		@PathVariable Long collectorId,
		Principal principal
	) {
		User currentUser = requireAuthenticatedUser(principal);
		Long effectiveCollectorId = collectorId;
		if ("ADMIN".equals(currentUser.getRole())) {
			effectiveCollectorId = collectorId;
		}
		else if ("COLLECTOR".equals(currentUser.getRole())) {
			effectiveCollectorId = collectorRepository.findByEmail(currentUser.getEmail())
				.map(Collector::getCollectorId)
				.orElseThrow(() -> new AccessDeniedException("Collector profile not found"));
		}
		else {
			throw new AccessDeniedException("Access denied");
		}
		return ResponseEntity.ok(wasteRequestService.getRequestsForCollector(effectiveCollectorId));
	}

	@GetMapping("/collector/me")
	public ResponseEntity<List<WasteRequest>> getMyCollectorRequests(Principal principal) {
		User currentUser = requireAuthenticatedUser(principal);
		if (!"COLLECTOR".equals(currentUser.getRole())) {
			throw new AccessDeniedException("Access denied");
		}
		Long collectorId = collectorRepository.findByEmail(currentUser.getEmail())
			.map(Collector::getCollectorId)
			.orElseThrow(() -> new AccessDeniedException("Collector profile not found"));
		return ResponseEntity.ok(wasteRequestService.getRequestsForCollector(collectorId));
	}

	@GetMapping("/collector/profile")
	public ResponseEntity<Collector> getMyCollectorProfile(Principal principal) {
		User currentUser = requireAuthenticatedUser(principal);
		if (!"COLLECTOR".equals(currentUser.getRole())) {
			throw new AccessDeniedException("Access denied");
		}
		Collector collector = collectorRepository.findByEmail(currentUser.getEmail())
			.orElseThrow(() -> new AccessDeniedException("Collector profile not found"));
		return ResponseEntity.ok(collector);
	}

	@PutMapping(value = "/updateStatus/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<WasteRequest> updateStatusWithProof(
		@PathVariable Long id,
		@RequestParam String status,
		@RequestParam(required = false) MultipartFile proof,
		Principal principal
	) throws IOException {
		User actingUser = requireAuthenticatedUser(principal);
		WasteRequest updated = wasteRequestService.updateStatus(id, status, proof, actingUser);
		return ResponseEntity.ok(updated);
	}

	@PutMapping("/{id}/status")
	public ResponseEntity<WasteRequest> updateStatus(
		@PathVariable Long id,
		@RequestParam String status,
		Principal principal
	) throws IOException {
		User actingUser = requireAuthenticatedUser(principal);
		WasteRequest updated = wasteRequestService.updateStatus(id, status, null, actingUser);
		return ResponseEntity.ok(updated);
	}

	@PostMapping(value = "/{id}/proof", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
	public ResponseEntity<WasteRequest> uploadProof(
		@PathVariable Long id,
		@RequestParam MultipartFile proof,
		Principal principal
	) throws IOException {
		User actingUser = requireAuthenticatedUser(principal);
		WasteRequest updated = wasteRequestService.uploadCollectorProof(id, proof, actingUser);
		return ResponseEntity.ok(updated);
	}

	private Long resolveUserId(Long userIdParam, Principal principal) {
		User currentUser = requireAuthenticatedUser(principal);
		if ("ADMIN".equals(currentUser.getRole())) {
			return userIdParam != null ? userIdParam : currentUser.getUserId();
		}
		return currentUser.getUserId();
	}

	private User requireAuthenticatedUser(Principal principal) {
		if (principal == null) {
			throw new AccessDeniedException("Authentication required");
		}
		return userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new AccessDeniedException("User not found"));
	}
}


