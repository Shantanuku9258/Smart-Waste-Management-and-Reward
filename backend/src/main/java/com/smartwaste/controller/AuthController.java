package com.smartwaste.controller;

import com.smartwaste.entity.User;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.security.JwtUtil;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

	private static final Logger log = LoggerFactory.getLogger(AuthController.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;

	public AuthController(UserRepository userRepository, PasswordEncoder passwordEncoder, JwtUtil jwtUtil) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
	}

	@PostMapping("/register")
	public ResponseEntity<Map<String, String>> register(@RequestBody User user) {
		log.info("Registering user {}", user.getEmail());
		
		// Check if user already exists
		if (userRepository.findByEmail(user.getEmail()).isPresent()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", "Email already registered"));
		}
		
		// Validate required fields
		if (user.getEmail() == null || user.getEmail().trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", "Email is required"));
		}
		if (user.getPasswordHash() == null || user.getPasswordHash().trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", "Password is required"));
		}
		if (user.getName() == null || user.getName().trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", "Name is required"));
		}
		
		user.setPasswordHash(passwordEncoder.encode(user.getPasswordHash()));
		if (user.getRole() == null) {
			user.setRole("USER");
		}
		// Points default to 0 (int primitive, so no null check needed)
		userRepository.save(user);
		return ResponseEntity.status(HttpStatus.CREATED)
			.body(Map.of("message", "User registered successfully"));
	}

	@PostMapping("/login")
	public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> loginData) {
		String email = loginData.get("email");
		String password = loginData.get("password");
		
		if (email == null || email.trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", "Email is required"));
		}
		if (password == null || password.trim().isEmpty()) {
			return ResponseEntity.status(HttpStatus.BAD_REQUEST)
				.body(Map.of("message", "Password is required"));
		}
		
		log.info("Login attempt for {}", email);

		User user = userRepository.findByEmail(email)
			.orElse(null);

		if (user == null || !passwordEncoder.matches(password, user.getPasswordHash())) {
			log.warn("Invalid credentials for {}", email);
			return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
				.body(Map.of("message", "Invalid email or password"));
		}

		log.info("Login success for {}", email);
		String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
		return ResponseEntity.ok(Map.of(
			"token", token, 
			"role", user.getRole(),
			"userId", String.valueOf(user.getUserId()),
			"name", user.getName() != null ? user.getName() : ""
		));
	}
}


