package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "user_eco_scores")
public class UserEcoScore {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long scoreId;

	@Column(name = "user_id", nullable = false)
	private Long userId;

	@Column(name = "eco_score", nullable = false)
	private Integer ecoScore;

	@Column(name = "activity_score")
	private Double activityScore;

	@Column(name = "segregation_score")
	private Double segregationScore;

	@Column(name = "frequency_score")
	private Integer frequencyScore;

	@Column(name = "weight_score")
	private Integer weightScore;

	@Column(name = "user_activity")
	private Integer userActivity;

	@Column(name = "segregation_accuracy")
	private Double segregationAccuracy;

	@Column(name = "request_frequency")
	private Double requestFrequency;

	@Column(name = "avg_weight")
	private Double avgWeight;

	@CreationTimestamp
	@Column(name = "calculated_date")
	private LocalDateTime calculatedDate;

	// Getters and Setters
	public Long getScoreId() {
		return scoreId;
	}

	public void setScoreId(Long scoreId) {
		this.scoreId = scoreId;
	}

	public Long getUserId() {
		return userId;
	}

	public void setUserId(Long userId) {
		this.userId = userId;
	}

	public Integer getEcoScore() {
		return ecoScore;
	}

	public void setEcoScore(Integer ecoScore) {
		this.ecoScore = ecoScore;
	}

	public Double getActivityScore() {
		return activityScore;
	}

	public void setActivityScore(Double activityScore) {
		this.activityScore = activityScore;
	}

	public Double getSegregationScore() {
		return segregationScore;
	}

	public void setSegregationScore(Double segregationScore) {
		this.segregationScore = segregationScore;
	}

	public Integer getFrequencyScore() {
		return frequencyScore;
	}

	public void setFrequencyScore(Integer frequencyScore) {
		this.frequencyScore = frequencyScore;
	}

	public Integer getWeightScore() {
		return weightScore;
	}

	public void setWeightScore(Integer weightScore) {
		this.weightScore = weightScore;
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

	public LocalDateTime getCalculatedDate() {
		return calculatedDate;
	}

	public void setCalculatedDate(LocalDateTime calculatedDate) {
		this.calculatedDate = calculatedDate;
	}
}

