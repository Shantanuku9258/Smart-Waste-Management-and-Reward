package com.smartwaste.controller;

import com.smartwaste.entity.Complaint;
import com.smartwaste.entity.User;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.repository.ComplaintRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.repository.WasteRequestRepository;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

	private final ComplaintRepository complaintRepository;
	private final WasteRequestRepository wasteRequestRepository;
	private final UserRepository userRepository;

	public ComplaintController(
		ComplaintRepository complaintRepository,
		WasteRequestRepository wasteRequestRepository,
		UserRepository userRepository
	) {
		this.complaintRepository = complaintRepository;
		this.wasteRequestRepository = wasteRequestRepository;
		this.userRepository = userRepository;
	}

	@PostMapping
	public ResponseEntity<Complaint> createComplaint(@RequestBody CreateComplaintRequest payload, Principal principal) {
		User user = requireAuthenticatedUser(principal);

		if (payload == null || payload.requestId == null || payload.message == null || payload.message.isBlank()) {
			throw new IllegalArgumentException("requestId and message are required");
		}

		WasteRequest request = wasteRequestRepository.findById(payload.requestId)
			.orElseThrow(() -> new IllegalArgumentException("Request not found: " + payload.requestId));

		// Users can only complain about their own requests
		if (!"ADMIN".equals(user.getRole()) && !request.getUserId().equals(user.getUserId())) {
			throw new AccessDeniedException("You cannot raise a complaint on this request");
		}

		Complaint complaint = new Complaint();
		complaint.setUser(user);
		complaint.setRequest(request);
		complaint.setMessage(payload.message);
		complaint.setStatus("OPEN");
		complaint.setCreatedAt(LocalDateTime.now());

		return ResponseEntity.ok(complaintRepository.save(complaint));
	}

	@GetMapping("/me")
	public ResponseEntity<List<Complaint>> myComplaints(Principal principal) {
		User user = requireAuthenticatedUser(principal);
		return ResponseEntity.ok(complaintRepository.findByUser_UserIdOrderByCreatedAtDesc(user.getUserId()));
	}

	private User requireAuthenticatedUser(Principal principal) {
		if (principal == null) {
			throw new AccessDeniedException("Authentication required");
		}
		return userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new AccessDeniedException("User not found"));
	}

	public record CreateComplaintRequest(Long requestId, String message) {}
}


