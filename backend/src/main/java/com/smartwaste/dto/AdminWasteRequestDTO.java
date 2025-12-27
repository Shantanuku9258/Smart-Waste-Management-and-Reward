package com.smartwaste.dto;

import java.time.LocalDateTime;

/**
 * Enriched DTO for admin dashboard to display waste requests with user, collector, and zone information.
 */
public class AdminWasteRequestDTO {
	private Long requestId;
	private Long userId;
	private String userName;
	private String userEmail;
	private Long collectorId;
	private String collectorName;
	private Long zoneId;
	private String zoneName;
	private String wasteType;
	private double weightKg;
	private String status;
	private String displayStatus; // UNASSIGNED or ASSIGNED
	private String pickupAddress;
	private LocalDateTime scheduledTime;
	private LocalDateTime collectedTime;
	private int rewardPoints;
	private String imageUrl;
	private String collectorProofUrl;
	private LocalDateTime createdAt;

	// Getters and Setters
	public Long getRequestId() {
		return requestId;
	}

	public void setRequestId(Long requestId) {
		this.requestId = requestId;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public String getUserName() {
		return userName;
	}

	public void setUserName(String userName) {
		this.userName = userName;
	}

	public String getUserEmail() {
		return userEmail;
	}

	public void setUserEmail(String userEmail) {
		this.userEmail = userEmail;
	}

	public Long getCollectorId() {
		return collectorId;
	}

	public void setCollectorId(Long collectorId) {
		this.collectorId = collectorId;
	}

	public String getCollectorName() {
		return collectorName;
	}

	public void setCollectorName(String collectorName) {
		this.collectorName = collectorName;
	}

	public Long getZoneId() {
		return zoneId;
	}

	public void setZoneId(Long zoneId) {
		this.zoneId = zoneId;
	}

	public String getZoneName() {
		return zoneName;
	}

	public void setZoneName(String zoneName) {
		this.zoneName = zoneName;
	}

	public String getWasteType() {
		return wasteType;
	}

	public void setWasteType(String wasteType) {
		this.wasteType = wasteType;
	}

	public double getWeightKg() {
		return weightKg;
	}

	public void setWeightKg(double weightKg) {
		this.weightKg = weightKg;
	}

	public String getStatus() {
		return status;
	}

	public void setStatus(String status) {
		this.status = status;
	}

	public String getDisplayStatus() {
		return displayStatus;
	}

	public void setDisplayStatus(String displayStatus) {
		this.displayStatus = displayStatus;
	}

	public String getPickupAddress() {
		return pickupAddress;
	}

	public void setPickupAddress(String pickupAddress) {
		this.pickupAddress = pickupAddress;
	}

	public LocalDateTime getScheduledTime() {
		return scheduledTime;
	}

	public void setScheduledTime(LocalDateTime scheduledTime) {
		this.scheduledTime = scheduledTime;
	}

	public LocalDateTime getCollectedTime() {
		return collectedTime;
	}

	public void setCollectedTime(LocalDateTime collectedTime) {
		this.collectedTime = collectedTime;
	}

	public int getRewardPoints() {
		return rewardPoints;
	}

	public void setRewardPoints(int rewardPoints) {
		this.rewardPoints = rewardPoints;
	}

	public String getImageUrl() {
		return imageUrl;
	}

	public void setImageUrl(String imageUrl) {
		this.imageUrl = imageUrl;
	}

	public String getCollectorProofUrl() {
		return collectorProofUrl;
	}

	public void setCollectorProofUrl(String collectorProofUrl) {
		this.collectorProofUrl = collectorProofUrl;
	}

	public LocalDateTime getCreatedAt() {
		return createdAt;
	}

	public void setCreatedAt(LocalDateTime createdAt) {
		this.createdAt = createdAt;
	}
}


