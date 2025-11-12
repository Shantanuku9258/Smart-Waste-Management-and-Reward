package com.smartwaste.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.CreationTimestamp;

@Entity
@Table(name = "users")
public class User {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long userId;

	private String name;

	@Column(unique = true, nullable = false)
	private String email;

	private String passwordHash;

	private String role; // USER, COLLECTOR, ADMIN

	private int points;

	@CreationTimestamp
	private LocalDateTime createdAt;

	public Long getUserId() { return userId; }
	public void setUserId(Long userId) { this.userId = userId; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
	public String getPasswordHash() { return passwordHash; }
	public void setPasswordHash(String passwordHash) { this.passwordHash = passwordHash; }
	public String getRole() { return role; }
	public void setRole(String role) { this.role = role; }
	public int getPoints() { return points; }
	public void setPoints(int points) { this.points = points; }
	public LocalDateTime getCreatedAt() { return createdAt; }
	public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}


