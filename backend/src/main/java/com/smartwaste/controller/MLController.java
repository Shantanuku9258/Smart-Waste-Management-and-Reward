package com.smartwaste.controller;

import com.smartwaste.dto.EcoScoreRequestDTO;
import com.smartwaste.dto.MLClassificationRequestDTO;
import com.smartwaste.dto.MLPredictionRequestDTO;
import com.smartwaste.entity.MLClassification;
import com.smartwaste.entity.MLPrediction;
import com.smartwaste.entity.UserEcoScore;
import com.smartwaste.service.MLService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/ml")
public class MLController {

	private final MLService mlService;

	public MLController(MLService mlService) {
		this.mlService = mlService;
	}

/**
 * Predict waste quantity for a zone.
 * <p>
 * Prototype note: this endpoint is advisory only and is not used
 * for automatic collector assignment, routing, or status updates.
 * It is safe for the rest of the system if this call fails.
 * POST /api/ml/predict/waste
 */
	@PostMapping("/predict/waste")
	@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'ADMIN')")
	public ResponseEntity<Map<String, Object>> predictWasteQuantity(
		@RequestBody MLPredictionRequestDTO request
	) {
		try {
			Map<String, Object> result = mlService.predictWasteQuantity(request);
			return ResponseEntity.ok(result);
		} catch (Exception e) {
			return ResponseEntity.status(503)
				.body(Map.of("error", "ML advisory service is currently offline. Core features continue to work normally."));
		}
	}

	/**
	 * Get predictions for a zone
	 * GET /api/ml/predictions/zone/{zoneId}
	 */
	@GetMapping("/predictions/zone/{zoneId}")
	@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'ADMIN')")
	public ResponseEntity<List<MLPrediction>> getZonePredictions(@PathVariable Long zoneId) {
		List<MLPrediction> predictions = mlService.getZonePredictions(zoneId);
		return ResponseEntity.ok(predictions);
	}

	/**
	 * Classify waste type
	 * POST /api/ml/classify/waste
	 */
	@PostMapping("/classify/waste")
	@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'ADMIN')")
	public ResponseEntity<Map<String, Object>> classifyWaste(
		@RequestBody MLClassificationRequestDTO request
	) {
		try {
			Map<String, Object> result = mlService.classifyWaste(request);
			return ResponseEntity.ok(result);
		} catch (Exception e) {
			return ResponseEntity.status(503)
				.body(Map.of("error", "ML advisory service is currently offline. Core features continue to work normally."));
		}
	}

	/**
	 * Classify waste and save to database
	 * POST /api/ml/classify/waste/{requestId}
	 */
	@PostMapping("/classify/waste/{requestId}")
	@PreAuthorize("hasAnyRole('USER', 'COLLECTOR', 'ADMIN')")
	public ResponseEntity<MLClassification> classifyWasteAndSave(
		@PathVariable Long requestId,
		@RequestBody MLClassificationRequestDTO request
	) {
		try {
			MLClassification classification = mlService.classifyWasteAndSave(requestId, request);
			return ResponseEntity.ok(classification);
		} catch (Exception e) {
			return ResponseEntity.status(503)
				.body(null);
		}
	}

	/**
	 * Calculate user eco score
	 * POST /api/ml/score/user
	 */
	@PostMapping("/score/user")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
	public ResponseEntity<Map<String, Object>> calculateEcoScore(
		@RequestBody EcoScoreRequestDTO request
	) {
		try {
			Map<String, Object> result = mlService.calculateEcoScore(request);
			return ResponseEntity.ok(result);
		} catch (Exception e) {
			return ResponseEntity.status(503)
				.body(Map.of("error", "ML advisory service is currently offline. Eco score cannot be calculated right now."));
		}
	}

	/**
	 * Calculate and get eco score for a user (auto-calculates from user activity)
	 * GET /api/ml/score/user/{userId}
	 */
	@GetMapping("/score/user/{userId}")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
	public ResponseEntity<UserEcoScore> getUserEcoScore(@PathVariable Long userId) {
		try {
			Optional<UserEcoScore> score = mlService.getUserEcoScore(userId);
			if (score.isPresent()) {
				return ResponseEntity.ok(score.get());
			} else {
				// Calculate score if not exists
				UserEcoScore ecoScore = mlService.calculateEcoScoreForUser(userId);
				return ResponseEntity.ok(ecoScore);
			}
		} catch (Exception e) {
			return ResponseEntity.status(503).build();
		}
	}

	/**
	 * Recalculate eco score for a user
	 * POST /api/ml/score/user/{userId}/recalculate
	 */
	@PostMapping("/score/user/{userId}/recalculate")
	@PreAuthorize("hasAnyRole('USER', 'ADMIN')")
	public ResponseEntity<UserEcoScore> recalculateEcoScore(@PathVariable Long userId) {
		try {
			UserEcoScore ecoScore = mlService.calculateEcoScoreForUser(userId);
			return ResponseEntity.ok(ecoScore);
		} catch (Exception e) {
			return ResponseEntity.status(503).build();
		}
	}
}

