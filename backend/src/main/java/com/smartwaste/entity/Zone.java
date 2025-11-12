package com.smartwaste.entity;

import jakarta.persistence.*;

@Entity
@Table(name = "zones")
public class Zone {
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long zoneId;

	private String zoneName;
	private String city;
	private String state;

	public Long getZoneId() { return zoneId; }
	public void setZoneId(Long zoneId) { this.zoneId = zoneId; }
	public String getZoneName() { return zoneName; }
	public void setZoneName(String zoneName) { this.zoneName = zoneName; }
	public String getCity() { return city; }
	public void setCity(String city) { this.city = city; }
	public String getState() { return state; }
	public void setState(String state) { this.state = state; }
}


