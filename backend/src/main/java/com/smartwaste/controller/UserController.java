package com.smartwaste.controller;

import com.smartwaste.entity.User;
import com.smartwaste.repository.UserRepository;
import java.security.Principal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

	private final UserRepository userRepository;

	public UserController(UserRepository userRepository) {
		this.userRepository = userRepository;
	}

	@GetMapping("/me")
	public ResponseEntity<UserProfileResponse> me(Principal principal) {
		User user = userRepository.findByEmail(principal.getName())
			.orElseThrow(() -> new IllegalStateException("User not found"));

		UserProfileResponse response = new UserProfileResponse(
			user.getUserId(),
			user.getName(),
			user.getEmail(),
			user.getRole(),
			user.getPoints()
		);
		return ResponseEntity.ok(response);
	}

	public record UserProfileResponse(
		Long userId,
		String name,
		String email,
		String role,
		Integer points
	) {}
}


