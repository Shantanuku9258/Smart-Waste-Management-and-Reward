package com.smartwaste.service;

import com.smartwaste.entity.RedemptionRequest;
import com.smartwaste.entity.RewardCatalog;
import com.smartwaste.entity.RewardTransaction;
import com.smartwaste.entity.User;
import com.smartwaste.repository.RedemptionRequestRepository;
import com.smartwaste.repository.RewardCatalogRepository;
import com.smartwaste.repository.RewardTransactionRepository;
import com.smartwaste.repository.UserRepository;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class RewardService {

	private final RewardCatalogRepository rewardCatalogRepository;
	private final RewardTransactionRepository rewardTransactionRepository;
	private final RedemptionRequestRepository redemptionRequestRepository;
	private final UserRepository userRepository;

	public RewardService(
		RewardCatalogRepository rewardCatalogRepository,
		RewardTransactionRepository rewardTransactionRepository,
		RedemptionRequestRepository redemptionRequestRepository,
		UserRepository userRepository
	) {
		this.rewardCatalogRepository = rewardCatalogRepository;
		this.rewardTransactionRepository = rewardTransactionRepository;
		this.redemptionRequestRepository = redemptionRequestRepository;
		this.userRepository = userRepository;
	}

	/**
	 * Get all active reward catalog items.
	 */
	public List<RewardCatalog> getActiveCatalog() {
		return rewardCatalogRepository.findAll()
			.stream()
			.filter(item -> item.getActive() == null || Boolean.TRUE.equals(item.getActive()))
			.toList();
	}

	/**
	 * Get redemption history for a specific user.
	 */
	public List<RedemptionRequest> getUserRedemptions(Long userId) {
		return redemptionRequestRepository.findByUser_UserIdOrderByCreatedAtDesc(userId);
	}

	/**
	 * Get all redemption requests (admin view).
	 */
	public List<RedemptionRequest> getAllRedemptions() {
		return redemptionRequestRepository.findAll();
	}

	/**
	 * Create a redemption request for the authenticated user.
	 * Deducts points only after successfully creating the request,
	 * and prevents negative balances.
	 */
	@Transactional
	public RedemptionRequest redeemReward(Long rewardId, User actor) {
		if (!"USER".equals(actor.getRole())) {
			throw new AccessDeniedException("Only regular users can redeem rewards");
		}

		User user = userRepository.findById(actor.getUserId())
			.orElseThrow(() -> new IllegalArgumentException("User not found: " + actor.getUserId()));

		RewardCatalog reward = rewardCatalogRepository.findById(rewardId)
			.orElseThrow(() -> new IllegalArgumentException("Reward not found: " + rewardId));

		if (reward.getActive() != null && !reward.getActive()) {
			throw new IllegalArgumentException("Reward is not currently available for redemption");
		}

		int requiredPoints = reward.getPointsRequired() != null ? reward.getPointsRequired() : 0;
		if (requiredPoints <= 0) {
			throw new IllegalArgumentException("Invalid points required for reward");
		}

		int currentPoints = user.getPoints();
		if (currentPoints < requiredPoints) {
			throw new IllegalArgumentException("Insufficient points for redemption");
		}

		// Deduct points and persist updated balance
		user.setPoints(currentPoints - requiredPoints);
		userRepository.save(user);

		// Log the redemption as a reward transaction (points spent)
		RewardTransaction transaction = new RewardTransaction();
		transaction.setUser(user);
		transaction.setPointsAdded(0);
		transaction.setPointsSpent(requiredPoints);
		transaction.setTransactionType("REDEEM");
		transaction.setDescription("Redeemed '" + reward.getRewardName() + "' (reward #" + reward.getRewardId() + ")");
		rewardTransactionRepository.save(transaction);

		// Create a redemption request in REQUESTED state
		RedemptionRequest redemption = new RedemptionRequest();
		redemption.setUser(user);
		redemption.setReward(reward);
		redemption.setPointsUsed(requiredPoints);
		redemption.setStatus("REQUESTED");

		return redemptionRequestRepository.save(redemption);
	}

	/**
	 * Mark a redemption as fulfilled. Admin-only operation.
	 * Does not modify points (already deducted at request time).
	 */
	@Transactional
	public RedemptionRequest fulfillRedemption(Long redemptionId, User actor) {
		if (!"ADMIN".equals(actor.getRole())) {
			throw new AccessDeniedException("Only admins can fulfill redemptions");
		}

		RedemptionRequest redemption = redemptionRequestRepository.findById(redemptionId)
			.orElseThrow(() -> new IllegalArgumentException("Redemption request not found: " + redemptionId));

		if ("FULFILLED".equalsIgnoreCase(redemption.getStatus())) {
			// Idempotent: already fulfilled, just return
			return redemption;
		}

		redemption.setStatus("FULFILLED");
		redemption.setFulfilledAt(LocalDateTime.now());

		return redemptionRequestRepository.save(redemption);
	}
}


