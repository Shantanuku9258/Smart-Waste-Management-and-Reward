package com.smartwaste.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "reward_catalog")
public class RewardCatalog {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long rewardId;

	private String rewardName;
	private Integer pointsRequired;
	@Lob
	private String details;

	/**
	 * Simple availability flag for prototype catalog control.
	 */
	private Boolean active = Boolean.TRUE;

	public Long getRewardId() { return rewardId; }
	public void setRewardId(Long rewardId) { this.rewardId = rewardId; }
	public String getRewardName() { return rewardName; }
	public void setRewardName(String rewardName) { this.rewardName = rewardName; }
	public Integer getPointsRequired() { return pointsRequired; }
	public void setPointsRequired(Integer pointsRequired) { this.pointsRequired = pointsRequired; }
	public String getDetails() { return details; }
	public void setDetails(String details) { this.details = details; }
	public Boolean getActive() { return active; }
	public void setActive(Boolean active) { this.active = active; }
}


