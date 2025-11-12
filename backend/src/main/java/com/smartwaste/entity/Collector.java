package com.smartwaste.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "collectors")
public class Collector {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long collectorId;

	private String name;
	private String email;
	private String contact;
	private String vehicleNumber;

	@ManyToOne
	@JoinColumn(name = "zone_id")
	private Zone zone;

	private Boolean isActive = Boolean.TRUE;

	public Long getCollectorId() { return collectorId; }
	public void setCollectorId(Long collectorId) { this.collectorId = collectorId; }
	public String getName() { return name; }
	public void setName(String name) { this.name = name; }
	public String getEmail() { return email; }
	public void setEmail(String email) { this.email = email; }
	public String getContact() { return contact; }
	public void setContact(String contact) { this.contact = contact; }
	public String getVehicleNumber() { return vehicleNumber; }
	public void setVehicleNumber(String vehicleNumber) { this.vehicleNumber = vehicleNumber; }
	public Zone getZone() { return zone; }
	public void setZone(Zone zone) { this.zone = zone; }
	public Boolean getIsActive() { return isActive; }
	public void setIsActive(Boolean isActive) { this.isActive = isActive; }
}


