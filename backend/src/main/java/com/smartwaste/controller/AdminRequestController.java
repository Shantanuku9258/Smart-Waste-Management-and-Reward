package com.smartwaste.controller;

import com.smartwaste.entity.User;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.service.WasteRequestService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/requests")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRequestController {

	private final WasteRequestService wasteRequestService;
	private final UserRepository userRepository;

	public AdminRequestController(WasteRequestService wasteRequestService, UserRepository userRepository) {
		this.wasteRequestService = wasteRequestService;
		this.userRepository = userRepository;
	}

	/**
	 * GET /api/admin/requests
	 * Get all waste requests for admin monitoring/assignment.
	 */
	@GetMapping
	public ResponseEntity<List<WasteRequest>> getAll() {
		return ResponseEntity.ok(wasteRequestService.getAllRequests());
	}

	@GetMapping("/delayed")
	public ResponseEntity<List<WasteRequest>> getDelayed() {
		// 48-hour threshold for prototype realism
		return ResponseEntity.ok(wasteRequestService.getDelayedRequests(48));
	}

	@PutMapping("/{id}/assign")
	public ResponseEntity<WasteRequest> reassign(
		@PathVariable Long id,
		@RequestParam Long collectorId,
		Principal principal
	) {
		User admin = requireAuthenticatedUser(principal);
		WasteRequest updated = wasteRequestService.reassignCollector(id, collectorId, admin);
		return ResponseEntity.ok(updated);
	}

	private User requireAuthenticatedUser(Principal principal) {
		if (principal == null) {
			throw new AccessDeniedException("Authentication required");
		}
		return userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new AccessDeniedException("User not found"));
	}
}


