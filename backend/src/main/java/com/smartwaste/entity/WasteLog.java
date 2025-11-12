package com.smartwaste.entity;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "waste_logs")
public class WasteLog {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long logId;

	@ManyToOne
	@JoinColumn(name = "zone_id")
	private Zone zone;

	private String wasteType;
	private BigDecimal collectedWeightKg;
	private LocalDate collectionDate;

	public Long getLogId() { return logId; }
	public void setLogId(Long logId) { this.logId = logId; }
	public Zone getZone() { return zone; }
	public void setZone(Zone zone) { this.zone = zone; }
	public String getWasteType() { return wasteType; }
	public void setWasteType(String wasteType) { this.wasteType = wasteType; }
	public BigDecimal getCollectedWeightKg() { return collectedWeightKg; }
	public void setCollectedWeightKg(BigDecimal collectedWeightKg) { this.collectedWeightKg = collectedWeightKg; }
	public LocalDate getCollectionDate() { return collectionDate; }
	public void setCollectionDate(LocalDate collectionDate) { this.collectionDate = collectionDate; }
}


