package com.smartwaste.dto;

/**
 * DTO for collector performance metrics
 */
public class CollectorPerformanceDTO {
	private Long collectorId;
	private String collectorName;
	private String email;
	private Long zoneId;
	private String zoneName;
	private Integer totalCollections;
	private Double totalWasteCollectedKg;
	private Double averageWeightPerCollection;
	private Integer completedRequests;
	private Integer pendingRequests;
	private Double completionRate;

	public CollectorPerformanceDTO() {
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

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
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

	public Integer getTotalCollections() {
		return totalCollections;
	}

	public void setTotalCollections(Integer totalCollections) {
		this.totalCollections = totalCollections;
	}

	public Double getTotalWasteCollectedKg() {
		return totalWasteCollectedKg;
	}

	public void setTotalWasteCollectedKg(Double totalWasteCollectedKg) {
		this.totalWasteCollectedKg = totalWasteCollectedKg;
	}

	public Double getAverageWeightPerCollection() {
		return averageWeightPerCollection;
	}

	public void setAverageWeightPerCollection(Double averageWeightPerCollection) {
		this.averageWeightPerCollection = averageWeightPerCollection;
	}

	public Integer getCompletedRequests() {
		return completedRequests;
	}

	public void setCompletedRequests(Integer completedRequests) {
		this.completedRequests = completedRequests;
	}

	public Integer getPendingRequests() {
		return pendingRequests;
	}

	public void setPendingRequests(Integer pendingRequests) {
		this.pendingRequests = pendingRequests;
	}

	public Double getCompletionRate() {
		return completionRate;
	}

	public void setCompletionRate(Double completionRate) {
		this.completionRate = completionRate;
	}
}

