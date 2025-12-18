package com.smartwaste.dto;

public class EcoScoreRequestDTO {
	private Long userId;
	private Integer userActivity;
	private Double segregationAccuracy;
	private Double requestFrequency;
	private Double avgWeight;

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public Integer getUserActivity() {
		return userActivity;
	}

	public void setUserActivity(Integer userActivity) {
		this.userActivity = userActivity;
	}

	public Double getSegregationAccuracy() {
		return segregationAccuracy;
	}

	public void setSegregationAccuracy(Double segregationAccuracy) {
		this.segregationAccuracy = segregationAccuracy;
	}

	public Double getRequestFrequency() {
		return requestFrequency;
	}

	public void setRequestFrequency(Double requestFrequency) {
		this.requestFrequency = requestFrequency;
	}

	public Double getAvgWeight() {
		return avgWeight;
	}

	public void setAvgWeight(Double avgWeight) {
		this.avgWeight = avgWeight;
	}
}

