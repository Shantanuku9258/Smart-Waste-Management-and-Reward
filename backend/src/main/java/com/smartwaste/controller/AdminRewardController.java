package com.smartwaste.controller;

import com.smartwaste.entity.RedemptionRequest;
import com.smartwaste.entity.User;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.service.RewardService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/rewards")
@PreAuthorize("hasRole('ADMIN')")
public class AdminRewardController {

	private final RewardService rewardService;
	private final UserRepository userRepository;

	public AdminRewardController(RewardService rewardService, UserRepository userRepository) {
		this.rewardService = rewardService;
		this.userRepository = userRepository;
	}

	@GetMapping("/redemptions")
	public ResponseEntity<List<AdminRedemptionItem>> getAllRedemptions() {
		List<AdminRedemptionItem> items = rewardService.getAllRedemptions()
			.stream()
			.map(this::toAdminItem)
			.toList();
		return ResponseEntity.ok(items);
	}

	@PutMapping("/redemptions/{id}/fulfill")
	public ResponseEntity<AdminRedemptionItem> fulfill(
		@PathVariable Long id,
		Principal principal
	) {
		User admin = requireAuthenticatedUser(principal);
		RedemptionRequest updated = rewardService.fulfillRedemption(id, admin);
		return ResponseEntity.ok(toAdminItem(updated));
	}

	private AdminRedemptionItem toAdminItem(RedemptionRequest r) {
		User u = r.getUser();
		return new AdminRedemptionItem(
			r.getRedemptionId(),
			r.getReward().getRewardId(),
			r.getReward().getRewardName(),
			r.getPointsUsed(),
			r.getStatus(),
			r.getCreatedAt(),
			r.getFulfilledAt(),
			u != null ? u.getUserId() : null,
			u != null ? u.getName() : null,
			u != null ? u.getEmail() : null
		);
	}

	private User requireAuthenticatedUser(Principal principal) {
		if (principal == null) {
			throw new AccessDeniedException("Authentication required");
		}
		return userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new AccessDeniedException("User not found"));
	}

	public record AdminRedemptionItem(
		Long redemptionId,
		Long rewardId,
		String rewardName,
		Integer pointsUsed,
		String status,
		java.time.LocalDateTime createdAt,
		java.time.LocalDateTime fulfilledAt,
		Long userId,
		String userName,
		String userEmail
	) {}
}


