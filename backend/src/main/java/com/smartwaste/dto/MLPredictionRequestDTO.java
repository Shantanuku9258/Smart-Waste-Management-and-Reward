package com.smartwaste.dto;

public class MLPredictionRequestDTO {
	private Long zoneId;
	private Double historicalWaste;
	private Integer dayOfWeek;
	private Integer month;

	public Long getZoneId() {
		return zoneId;
	}

	public void setZoneId(Long zoneId) {
		this.zoneId = zoneId;
	}

	public Double getHistoricalWaste() {
		return historicalWaste;
	}

	public void setHistoricalWaste(Double historicalWaste) {
		this.historicalWaste = historicalWaste;
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
}

