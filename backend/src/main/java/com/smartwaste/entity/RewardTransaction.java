package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "reward_transactions")
public class RewardTransaction {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long transactionId;

	@ManyToOne
	@JoinColumn(name = "user_id")
	private User user;

	private Long requestId; // Link to waste request for duplicate prevention

	private Integer pointsAdded = 0;
	private Integer pointsSpent = 0;
	private String transactionType; // ADD, REDEEM
	private String description;

	@CreationTimestamp
	private LocalDateTime createdAt;

	public Long getTransactionId() { return transactionId; }
	public void setTransactionId(Long transactionId) { this.transactionId = transactionId; }
	public User getUser() { return user; }
	public void setUser(User user) { this.user = user; }
	public Integer getPointsAdded() { return pointsAdded; }
	public void setPointsAdded(Integer pointsAdded) { this.pointsAdded = pointsAdded; }
	public Integer getPointsSpent() { return pointsSpent; }
	public void setPointsSpent(Integer pointsSpent) { this.pointsSpent = pointsSpent; }
	public String getTransactionType() { return transactionType; }
	public void setTransactionType(String transactionType) { this.transactionType = transactionType; }
	public String getDescription() { return description; }
	public void setDescription(String description) { this.description = description; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
	public Long getRequestId() { return requestId; }
	public void setRequestId(Long requestId) { this.requestId = requestId; }
}


