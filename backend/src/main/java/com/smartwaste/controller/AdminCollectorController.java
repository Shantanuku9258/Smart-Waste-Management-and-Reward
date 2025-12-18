package com.smartwaste.controller;

import com.smartwaste.entity.Collector;
import com.smartwaste.entity.User;
import com.smartwaste.entity.Zone;
import com.smartwaste.repository.CollectorRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.repository.ZoneRepository;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import java.security.Principal;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Admin-only collector management endpoints.
 *
 * <p>Prototype note: these endpoints are intended for demonstration purposes
 * to allow an admin to create collector accounts from the UI without touching
 * the database directly.
 */
@RestController
@RequestMapping("/api/admin/collectors")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCollectorController {

	private final UserRepository userRepository;
	private final CollectorRepository collectorRepository;
	private final ZoneRepository zoneRepository;
	private final PasswordEncoder passwordEncoder;

	public AdminCollectorController(
		UserRepository userRepository,
		CollectorRepository collectorRepository,
		ZoneRepository zoneRepository,
		PasswordEncoder passwordEncoder
	) {
		this.userRepository = userRepository;
		this.collectorRepository = collectorRepository;
		this.zoneRepository = zoneRepository;
		this.passwordEncoder = passwordEncoder;
	}

	/**
	 * GET /api/admin/collectors
	 * List all collectors with their basic info.
	 */
	@GetMapping
	public ResponseEntity<List<Collector>> getAllCollectors() {
		return ResponseEntity.ok(collectorRepository.findAll());
	}

	/**
	 * GET /api/admin/collectors/zones
	 * List all zones for assigning collectors.
	 */
	@GetMapping("/zones")
	public ResponseEntity<List<Zone>> getAllZones() {
		return ResponseEntity.ok(zoneRepository.findAll());
	}

	/**
	 * POST /api/admin/collectors
	 * Create a new collector user + collector profile.
	 */
	@PostMapping
	public ResponseEntity<?> createCollector(
		@Valid @RequestBody CreateCollectorRequest request,
		Principal principal
	) {
		requireAdmin(principal);

		if (userRepository.findByEmail(request.email.toLowerCase()).isPresent()) {
			return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(Map.of("message", "Email already registered"));
		}

		// Create user account with COLLECTOR role
		User user = new User();
		user.setName(request.name.trim());
		user.setEmail(request.email.trim().toLowerCase());
		user.setPasswordHash(passwordEncoder.encode(request.password));
		user.setRole("COLLECTOR");
		user.setPoints(0);
		User savedUser = userRepository.save(user);

		// Create collector profile
		Collector collector = new Collector();
		collector.setName(savedUser.getName());
		collector.setEmail(savedUser.getEmail());
		collector.setContact(request.contact != null ? request.contact : "N/A");
		collector.setVehicleNumber(request.vehicleNumber != null ? request.vehicleNumber : "N/A");

		if (request.zoneId != null) {
			Zone zone = zoneRepository.findById(request.zoneId)
				.orElse(null);
			collector.setZone(zone);
		}

		Collector savedCollector = collectorRepository.save(collector);

		return ResponseEntity.status(HttpStatus.CREATED).body(savedCollector);
	}

	private void requireAdmin(Principal principal) {
		if (principal == null) {
			throw new AccessDeniedException("Authentication required");
		}
		User currentUser = userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new AccessDeniedException("User not found"));
		if (!"ADMIN".equals(currentUser.getRole())) {
			throw new AccessDeniedException("Only admins can manage collectors");
		}
	}

	public static class CreateCollectorRequest {
		@NotBlank
		public String name;

		@NotBlank
		@Email
		public String email;

		@NotBlank
		public String password;

		public String contact;
		public String vehicleNumber;
		public Long zoneId;
	}
}


