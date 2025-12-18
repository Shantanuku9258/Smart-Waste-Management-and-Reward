package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "ml_classifications")
public class MLClassification {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long classificationId;

	@Column(name = "request_id")
	private Long requestId;

	@Column(name = "waste_type", nullable = false, length = 50)
	private String wasteType;

	@Column(name = "confidence")
	private Double confidence;

	@Lob
	@Column(name = "description")
	private String description;

	@CreationTimestamp
	@Column(name = "classification_date")
	private LocalDateTime classificationDate;

	// Getters and Setters
	public Long getClassificationId() {
		return classificationId;
	}

	public void setClassificationId(Long classificationId) {
		this.classificationId = classificationId;
	}

	public Long getRequestId() {
		return requestId;
	}

	public void setRequestId(Long requestId) {
		this.requestId = requestId;
	}

	public String getWasteType() {
		return wasteType;
	}

	public void setWasteType(String wasteType) {
		this.wasteType = wasteType;
	}

	public Double getConfidence() {
		return confidence;
	}

	public void setConfidence(Double confidence) {
		this.confidence = confidence;
	}

	public String getDescription() {
		return description;
	}

	public void setDescription(String description) {
		this.description = description;
	}

	public LocalDateTime getClassificationDate() {
		return classificationDate;
	}

	public void setClassificationDate(LocalDateTime classificationDate) {
		this.classificationDate = classificationDate;
	}
}

