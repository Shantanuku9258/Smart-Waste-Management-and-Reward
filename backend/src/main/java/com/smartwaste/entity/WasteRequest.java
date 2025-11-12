package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "waste_requests")
public class WasteRequest {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long requestId;

	private Long userId;

	private Long collectorId;

	@Column(name = "zone_id")
	private Long zoneId;

	private String wasteType;

	private double weightKg;

	private String status;

	@Lob
	private String pickupAddress;

	private LocalDateTime scheduledTime;

	private LocalDateTime collectedTime;

	private int rewardPoints;

	@Column(name = "image_url")
	private String imageUrl;

	@Column(name = "collector_proof_url")
	private String collectorProofUrl;

	@CreationTimestamp
	@Column(name = "request_date")
	private LocalDateTime createdAt;

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

	public Long getCollectorId() {
		return collectorId;
	}

	public void setCollectorId(Long collectorId) {
		this.collectorId = collectorId;
	}

	public Long getZoneId() {
		return zoneId;
	}

	public void setZoneId(Long zoneId) {
		this.zoneId = zoneId;
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


