package com.smartwaste.controller;

import com.smartwaste.config.RateLimitingConfig;
import com.smartwaste.entity.User;
import com.smartwaste.repository.UserRepository;
import com.smartwaste.security.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.HashMap;
import java.util.Map;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

/**
 * Authentication Controller
 * Handles user registration and login with rate limiting
 */
@RestController
@RequestMapping("/api/auth")
@CrossOrigin
public class AuthController {

	private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

	private final UserRepository userRepository;
	private final PasswordEncoder passwordEncoder;
	private final JwtUtil jwtUtil;
	private final RateLimitingConfig rateLimitingConfig;

	public AuthController(
		UserRepository userRepository,
		PasswordEncoder passwordEncoder,
		JwtUtil jwtUtil,
		RateLimitingConfig rateLimitingConfig
	) {
		this.userRepository = userRepository;
		this.passwordEncoder = passwordEncoder;
		this.jwtUtil = jwtUtil;
		this.rateLimitingConfig = rateLimitingConfig;
	}

	@PostMapping("/register")
	public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
		logger.info("Registration attempt for email: {}", request.email);

		if (userRepository.findByEmail(request.email).isPresent()) {
			logger.warn("Registration failed: Email already exists - {}", request.email);
			return ResponseEntity.status(HttpStatus.CONFLICT)
				.body(Map.of("message", "Email already registered"));
		}

		// Security: Prevent ADMIN role creation from registration endpoint
		// ADMIN accounts can only be created via database initialization
		String requestedRole = request.role != null ? request.role.toUpperCase() : "USER";
		if ("ADMIN".equals(requestedRole)) {
			logger.warn("Registration blocked: Attempt to create ADMIN account from UI - {}", request.email);
			return ResponseEntity.status(HttpStatus.FORBIDDEN)
				.body(Map.of("message", "Admin accounts cannot be created through registration"));
		}

		// Only allow USER or COLLECTOR roles
		if (!"USER".equals(requestedRole) && !"COLLECTOR".equals(requestedRole)) {
			requestedRole = "USER"; // Default to USER for invalid roles
		}

		User user = new User();
		user.setName(request.name.trim());
		user.setEmail(request.email.trim().toLowerCase());
		user.setPasswordHash(passwordEncoder.encode(request.password));
		user.setRole(requestedRole);
		user.setPoints(0);

		userRepository.save(user);
		logger.info("User registered successfully with role {}: {}", requestedRole, user.getEmail());

		return ResponseEntity.status(HttpStatus.CREATED)
			.body(Map.of("message", "User registered successfully", "userId", user.getUserId(), "role", requestedRole));
	}

	@PostMapping("/login")
	public ResponseEntity<Map<String, Object>> login(
		@Valid @RequestBody LoginRequest request,
		HttpServletRequest httpRequest
	) {
		String clientId = getClientId(httpRequest);

		// Rate limiting check
		if (!rateLimitingConfig.isLoginAllowed(clientId)) {
			logger.warn("Login rate limit exceeded for client: {}", clientId);
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(Map.of("message", "Too many login attempts. Please try again later."));
		}

		logger.info("Login attempt for email: {}", request.email);

		User user = userRepository.findByEmail(request.email)
			.orElseThrow(() -> {
				logger.warn("Login failed: User not found - {}", request.email);
				return new BadCredentialsException("Invalid credentials");
			});

		if (!passwordEncoder.matches(request.password, user.getPasswordHash())) {
			logger.warn("Login failed: Invalid password for user - {}", request.email);
			throw new BadCredentialsException("Invalid credentials");
		}

		String token = jwtUtil.generateToken(user.getEmail(), user.getRole());
		logger.info("User logged in successfully: {}", user.getEmail());

		Map<String, Object> response = new HashMap<>();
		response.put("token", token);
		response.put("role", user.getRole());
		response.put("userId", user.getUserId());
		response.put("name", user.getName());
		response.put("email", user.getEmail());

		return ResponseEntity.ok(response);
	}

	private String getClientId(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
			return xForwardedFor.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}

	// DTOs for request validation
	public static class RegisterRequest {
		@NotBlank(message = "Name is required")
		@Size(min = 2, max = 255, message = "Name must be between 2 and 255 characters")
		public String name;

		@NotBlank(message = "Email is required")
		@Email(message = "Email must be valid")
		public String email;

		@NotBlank(message = "Password is required")
		@Size(min = 6, message = "Password must be at least 6 characters")
		public String password;

		public String role;
	}

	public static class LoginRequest {
		@NotBlank(message = "Email is required")
		@Email(message = "Email must be valid")
		public String email;

		@NotBlank(message = "Password is required")
		public String password;
	}
}
