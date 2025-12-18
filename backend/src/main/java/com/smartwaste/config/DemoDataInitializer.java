package com.smartwaste.config;

import com.smartwaste.entity.Collector;
import com.smartwaste.entity.User;
import com.smartwaste.repository.CollectorRepository;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.repository.ZoneRepository;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

/**
 * Demo data initializer for college prototype.
 *
 * <p>IMPORTANT (prototype only):
 * - Creates default ADMIN, COLLECTOR and USER accounts on startup if they do not exist.
 * - These accounts are for demonstration/testing only and must NOT be used in production.
 *
 * Default credentials:
 * - admin@system.com     / Admin@123     (role: ADMIN)
 * - collector@system.com / Collector@123 (role: COLLECTOR)
 * - user@system.com      / User@123      (role: USER)
 */
@Configuration
public class DemoDataInitializer {

	private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

	@Bean
	public CommandLineRunner seedDemoUsers(
		UserRepository userRepository,
		CollectorRepository collectorRepository,
		ZoneRepository zoneRepository,
		PasswordEncoder passwordEncoder
	) {
		return args -> {
			// Admin account
			createUserIfMissing(
				userRepository,
				passwordEncoder,
				"Admin Demo",
				"admin@system.com",
				"Admin@123",
				"ADMIN"
			);

			// Collector account (with matching Collector profile if possible)
			User collectorUser = createUserIfMissing(
				userRepository,
				passwordEncoder,
				"Demo Collector",
				"collector@system.com",
				"Collector@123",
				"COLLECTOR"
			);
			createCollectorProfileIfMissing(collectorRepository, zoneRepository, collectorUser);

			// Regular user account
			createUserIfMissing(
				userRepository,
				passwordEncoder,
				"Demo User",
				"user@system.com",
				"User@123",
				"USER"
			);
		};
	}

	private User createUserIfMissing(
		UserRepository userRepository,
		PasswordEncoder passwordEncoder,
		String name,
		String email,
		String rawPassword,
		String role
	) {
		Optional<User> existing = userRepository.findByEmail(email.toLowerCase());
		if (existing.isPresent()) {
			return existing.get();
		}

		User user = new User();
		user.setName(name);
		user.setEmail(email.toLowerCase());
		user.setPasswordHash(passwordEncoder.encode(rawPassword));
		user.setRole(role);
		user.setPoints(0);

		User saved = userRepository.save(user);
		log.info("Created demo {} account with email: {}", role, email);
		return saved;
	}

	private void createCollectorProfileIfMissing(
		CollectorRepository collectorRepository,
		ZoneRepository zoneRepository,
		User collectorUser
	) {
		if (collectorUser == null) {
			return;
		}

		if (collectorRepository.findByEmail(collectorUser.getEmail()).isPresent()) {
			return;
		}

		Collector collector = new Collector();
		collector.setName(collectorUser.getName());
		collector.setEmail(collectorUser.getEmail());
		collector.setContact("0000000000"); // demo placeholder
		collector.setVehicleNumber("DEMO-VEHICLE");

		// Attach to any existing zone if available (optional for demo)
		zoneRepository.findAll().stream().findFirst().ifPresent(collector::setZone);

		collectorRepository.save(collector);
		log.info("Created demo Collector profile for email: {}", collectorUser.getEmail());
	}
}


