package com.smartwaste.dto;

import java.time.LocalDate;

/**
 * DTO for analytics overview dashboard
 */
public class AnalyticsOverviewDTO {
	private Double totalWasteCollected;
	private Integer totalRequests;
	private Integer totalUsers;
	private Integer totalCollectors;
	private Double averageEcoScore;
	private Double predictionAccuracy;
	private LocalDate periodStart;
	private LocalDate periodEnd;

	public AnalyticsOverviewDTO() {
	}

	public Double getTotalWasteCollected() {
		return totalWasteCollected;
	}

	public void setTotalWasteCollected(Double totalWasteCollected) {
		this.totalWasteCollected = totalWasteCollected;
	}

	public Integer getTotalRequests() {
		return totalRequests;
	}

	public void setTotalRequests(Integer totalRequests) {
		this.totalRequests = totalRequests;
	}

	public Integer getTotalUsers() {
		return totalUsers;
	}

	public void setTotalUsers(Integer totalUsers) {
		this.totalUsers = totalUsers;
	}

	public Integer getTotalCollectors() {
		return totalCollectors;
	}

	public void setTotalCollectors(Integer totalCollectors) {
		this.totalCollectors = totalCollectors;
	}

	public Double getAverageEcoScore() {
		return averageEcoScore;
	}

	public void setAverageEcoScore(Double averageEcoScore) {
		this.averageEcoScore = averageEcoScore;
	}

	public Double getPredictionAccuracy() {
		return predictionAccuracy;
	}

	public void setPredictionAccuracy(Double predictionAccuracy) {
		this.predictionAccuracy = predictionAccuracy;
	}

	public LocalDate getPeriodStart() {
		return periodStart;
	}

	public void setPeriodStart(LocalDate periodStart) {
		this.periodStart = periodStart;
	}

	public LocalDate getPeriodEnd() {
		return periodEnd;
	}

	public void setPeriodEnd(LocalDate periodEnd) {
		this.periodEnd = periodEnd;
	}
}

