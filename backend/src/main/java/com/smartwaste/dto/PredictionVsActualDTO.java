package com.smartwaste.dto;

import java.time.LocalDate;

/**
 * DTO for ML prediction vs actual comparison
 */
public class PredictionVsActualDTO {
	private LocalDate date;
	private Long zoneId;
	private String zoneName;
	private Double predictedWasteKg;
	private Double actualWasteKg;
	private Double difference;
	private Double accuracyPercentage;

	public PredictionVsActualDTO() {
	}

	public LocalDate getDate() {
		return date;
	}

	public void setDate(LocalDate date) {
		this.date = date;
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

	public Double getPredictedWasteKg() {
		return predictedWasteKg;
	}

	public void setPredictedWasteKg(Double predictedWasteKg) {
		this.predictedWasteKg = predictedWasteKg;
	}

	public Double getActualWasteKg() {
		return actualWasteKg;
	}

	public void setActualWasteKg(Double actualWasteKg) {
		this.actualWasteKg = actualWasteKg;
	}

	public Double getDifference() {
		return difference;
	}

	public void setDifference(Double difference) {
		this.difference = difference;
	}

	public Double getAccuracyPercentage() {
		return accuracyPercentage;
	}

	public void setAccuracyPercentage(Double accuracyPercentage) {
		this.accuracyPercentage = accuracyPercentage;
	}
}

