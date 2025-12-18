package com.smartwaste.dto;

/**
 * DTO for waste type breakdown
 */
public class WasteByTypeDTO {
	private String wasteType;
	private Double totalWasteKg;
	private Integer requestCount;
	private Double percentage;

	public WasteByTypeDTO() {
	}

	public WasteByTypeDTO(String wasteType, Double totalWasteKg, Integer requestCount, Double percentage) {
		this.wasteType = wasteType;
		this.totalWasteKg = totalWasteKg;
		this.requestCount = requestCount;
		this.percentage = percentage;
	}

	public String getWasteType() {
		return wasteType;
	}

	public void setWasteType(String wasteType) {
		this.wasteType = wasteType;
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

	public Double getPercentage() {
		return percentage;
	}

	public void setPercentage(Double percentage) {
		this.percentage = percentage;
	}
}

