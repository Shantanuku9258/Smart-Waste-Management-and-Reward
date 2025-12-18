package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "complaints")
public class Complaint {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long complaintId;

	@ManyToOne
	@JoinColumn(name = "user_id", nullable = false)
	private User user;

	@ManyToOne
	@JoinColumn(name = "request_id", nullable = false)
	private WasteRequest request;

	@Lob
	private String message;

	private String status = "OPEN";

	@CreationTimestamp
	private LocalDateTime createdAt;

	public Long getComplaintId() { return complaintId; }
	public void setComplaintId(Long complaintId) { this.complaintId = complaintId; }

	public User getUser() { return user; }
	public void setUser(User user) { this.user = user; }

	public WasteRequest getRequest() { return request; }
	public void setRequest(WasteRequest request) { this.request = request; }

	public String getMessage() { return message; }
	public void setMessage(String message) { this.message = message; }

	public String getStatus() { return status; }
	public void setStatus(String status) { this.status = status; }

	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}


