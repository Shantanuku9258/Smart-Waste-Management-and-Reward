package com.smartwaste.controller;

import com.smartwaste.entity.RedemptionRequest;
import com.smartwaste.entity.RewardCatalog;
import com.smartwaste.entity.RewardTransaction;
import com.smartwaste.entity.User;
import com.smartwaste.repository.RewardTransactionRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.service.RewardService;
import java.security.Principal;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/rewards")
public class RewardController {

	private final RewardService rewardService;
	private final UserRepository userRepository;
	private final RewardTransactionRepository rewardTransactionRepository;

	public RewardController(
		RewardService rewardService,
		UserRepository userRepository,
		RewardTransactionRepository rewardTransactionRepository
	) {
		this.rewardService = rewardService;
		this.userRepository = userRepository;
		this.rewardTransactionRepository = rewardTransactionRepository;
	}

	@GetMapping("/catalog")
	public ResponseEntity<List<RewardCatalog>> getCatalog() {
		return ResponseEntity.ok(rewardService.getActiveCatalog());
	}

	@PostMapping("/redeem/{rewardId}")
	public ResponseEntity<UserRedemptionResponse> redeem(
		@PathVariable Long rewardId,
		Principal principal
	) {
		User currentUser = requireAuthenticatedUser(principal);
		RedemptionRequest redemption = rewardService.redeemReward(rewardId, currentUser);

		User updatedUser = userRepository.findById(currentUser.getUserId())
			.orElseThrow(() -> new IllegalArgumentException("User not found: " + currentUser.getUserId()));

		UserRedemptionResponse response = new UserRedemptionResponse(
			redemption.getRedemptionId(),
			redemption.getReward().getRewardId(),
			redemption.getReward().getRewardName(),
			redemption.getPointsUsed(),
			redemption.getStatus(),
			updatedUser.getPoints()
		);

		return ResponseEntity.ok(response);
	}

	@GetMapping("/my-redemptions")
	public ResponseEntity<List<UserRedemptionHistoryItem>> getMyRedemptions(Principal principal) {
		User currentUser = requireAuthenticatedUser(principal);
		List<UserRedemptionHistoryItem> history = rewardService.getUserRedemptions(currentUser.getUserId())
			.stream()
			.map(r -> new UserRedemptionHistoryItem(
				r.getRedemptionId(),
				r.getReward().getRewardId(),
				r.getReward().getRewardName(),
				r.getPointsUsed(),
				r.getStatus(),
				r.getCreatedAt(),
				r.getFulfilledAt()
			))
			.toList();
		return ResponseEntity.ok(history);
	}

	@GetMapping("/my-transactions")
	public ResponseEntity<List<UserTransactionHistoryItem>> getMyTransactions(Principal principal) {
		User currentUser = requireAuthenticatedUser(principal);
		List<RewardTransaction> transactions = rewardTransactionRepository
			.findByUser_UserIdOrderByCreatedAtDesc(currentUser.getUserId());
		
		List<UserTransactionHistoryItem> history = transactions.stream()
			.map(t -> new UserTransactionHistoryItem(
				t.getTransactionId(),
				t.getRequestId(),
				t.getPointsAdded(),
				t.getPointsSpent(),
				t.getTransactionType(),
				t.getDescription(),
				t.getCreatedAt()
			))
			.toList();
		return ResponseEntity.ok(history);
	}

	private User requireAuthenticatedUser(Principal principal) {
		if (principal == null) {
			throw new AccessDeniedException("Authentication required");
		}
		return userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new AccessDeniedException("User not found"));
	}

	public record UserRedemptionResponse(
		Long redemptionId,
		Long rewardId,
		String rewardName,
		Integer pointsUsed,
		String status,
		Integer updatedPoints
	) {}

	public record UserRedemptionHistoryItem(
		Long redemptionId,
		Long rewardId,
		String rewardName,
		Integer pointsUsed,
		String status,
		java.time.LocalDateTime createdAt,
		java.time.LocalDateTime fulfilledAt
	) {}

	public record UserTransactionHistoryItem(
		Long transactionId,
		Long requestId,
		Integer pointsAdded,
		Integer pointsSpent,
		String transactionType,
		String description,
		java.time.LocalDateTime createdAt
	) {}
}


