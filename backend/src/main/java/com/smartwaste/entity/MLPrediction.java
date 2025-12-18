package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "ml_predictions")
public class MLPrediction {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long predictionId;

	@Column(name = "zone_id", nullable = false)
	private Long zoneId;

	@Column(name = "predicted_waste_kg", nullable = false)
	private Double predictedWasteKg;

	@Column(name = "historical_waste_kg")
	private Double historicalWasteKg;

	@Column(name = "day_of_week")
	private Integer dayOfWeek;

	@Column(name = "month")
	private Integer month;

	@CreationTimestamp
	@Column(name = "prediction_date")
	private LocalDateTime predictionDate;

	// Getters and Setters
	public Long getPredictionId() {
		return predictionId;
	}

	public void setPredictionId(Long predictionId) {
		this.predictionId = predictionId;
	}

	public Long getZoneId() {
		return zoneId;
	}

	public void setZoneId(Long zoneId) {
		this.zoneId = zoneId;
	}

	public Double getPredictedWasteKg() {
		return predictedWasteKg;
	}

	public void setPredictedWasteKg(Double predictedWasteKg) {
		this.predictedWasteKg = predictedWasteKg;
	}

	public Double getHistoricalWasteKg() {
		return historicalWasteKg;
	}

	public void setHistoricalWasteKg(Double historicalWasteKg) {
		this.historicalWasteKg = historicalWasteKg;
	}

	public Integer getDayOfWeek() {
		return dayOfWeek;
	}

	public void setDayOfWeek(Integer dayOfWeek) {
		this.dayOfWeek = dayOfWeek;
	}

	public Integer getMonth() {
		return month;
	}

	public void setMonth(Integer month) {
		this.month = month;
	}

	public LocalDateTime getPredictionDate() {
		return predictionDate;
	}

	public void setPredictionDate(LocalDateTime predictionDate) {
		this.predictionDate = predictionDate;
	}
}

