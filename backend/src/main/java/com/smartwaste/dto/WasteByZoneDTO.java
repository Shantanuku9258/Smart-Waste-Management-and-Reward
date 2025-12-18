package com.smartwaste.dto;

/**
 * DTO for zone-wise waste distribution
 */
public class WasteByZoneDTO {
	private Long zoneId;
	private String zoneName;
	private Double totalWasteKg;
	private Integer requestCount;
	private Double averageWeight;

	public WasteByZoneDTO() {
	}

	public WasteByZoneDTO(Long zoneId, String zoneName, Double totalWasteKg, Integer requestCount, Double averageWeight) {
		this.zoneId = zoneId;
		this.zoneName = zoneName;
		this.totalWasteKg = totalWasteKg;
		this.requestCount = requestCount;
		this.averageWeight = averageWeight;
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

	public Double getTotalWasteKg() {
		return totalWasteKg;
	}

	public void setTotalWasteKg(Double totalWasteKg) {
		this.totalWasteKg = totalWasteKg;
	}

	public Integer getRequestCount() {
		return requestCount;
	}

	public void setRequestCount(Integer requestCount) {
		this.requestCount = requestCount;
	}

	public Double getAverageWeight() {
		return averageWeight;
	}

	public void setAverageWeight(Double averageWeight) {
		this.averageWeight = averageWeight;
	}
}

