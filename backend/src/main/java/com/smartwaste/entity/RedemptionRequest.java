package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "redemption_requests")
public class RedemptionRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long redemptionId;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne
	@JoinColumn(name = "reward_id", nullable = false)
	private RewardCatalog reward;

	private Integer pointsUsed;

	/**
	 * REQUESTED, FULFILLED
	 */
	private String status;

	@CreationTimestamp
	private LocalDateTime createdAt;

	private LocalDateTime fulfilledAt;

	public Long getRedemptionId() {
		return redemptionId;
	}

	public void setRedemptionId(Long redemptionId) {
		this.redemptionId = redemptionId;
	}

	public User getUser() {
		return user;
	}

	public void setUser(User user) {
		this.user = user;
	}

	public RewardCatalog getReward() {
		return reward;
	}

	public void setReward(RewardCatalog reward) {
		this.reward = reward;
	}

	public Integer getPointsUsed() {
		return pointsUsed;
	}

	public void setPointsUsed(Integer pointsUsed) {
		this.pointsUsed = pointsUsed;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}

	public LocalDateTime getFulfilledAt() {
		return fulfilledAt;
	}

	public void setFulfilledAt(LocalDateTime fulfilledAt) {
		this.fulfilledAt = fulfilledAt;
	}
}


