package com.smartwaste.dto;

/**
 * DTO for top eco-score users
 */
public class TopEcoUserDTO {
	private Long userId;
	private String userName;
	private String email;
	private Integer ecoScore;
	private Integer totalRequests;
	private Double totalWasteKg;
	private Double averageWeight;
	private Double requestFrequency;

	public TopEcoUserDTO() {
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

	public String getEmail() {
		return email;
	}

	public void setEmail(String email) {
		this.email = email;
	}

	public Integer getEcoScore() {
		return ecoScore;
	}

	public void setEcoScore(Integer ecoScore) {
		this.ecoScore = ecoScore;
	}

	public Integer getTotalRequests() {
		return totalRequests;
	}

	public void setTotalRequests(Integer totalRequests) {
		this.totalRequests = totalRequests;
	}

	public Double getTotalWasteKg() {
		return totalWasteKg;
	}

	public void setTotalWasteKg(Double totalWasteKg) {
		this.totalWasteKg = totalWasteKg;
	}

	public Double getAverageWeight() {
		return averageWeight;
	}

	public void setAverageWeight(Double averageWeight) {
		this.averageWeight = averageWeight;
	}

	public Double getRequestFrequency() {
		return requestFrequency;
	}

	public void setRequestFrequency(Double requestFrequency) {
		this.requestFrequency = requestFrequency;
	}
}

