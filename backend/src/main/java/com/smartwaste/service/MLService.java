package com.smartwaste.service;

import com.smartwaste.dto.EcoScoreRequestDTO;
import com.smartwaste.dto.MLClassificationRequestDTO;
import com.smartwaste.dto.MLPredictionRequestDTO;
import com.smartwaste.entity.MLClassification;
import com.smartwaste.entity.MLPrediction;
import com.smartwaste.entity.UserEcoScore;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.repository.MLClassificationRepository;
import com.smartwaste.repository.MLPredictionRepository;
import com.smartwaste.repository.UserEcoScoreRepository;
import com.smartwaste.repository.WasteRequestRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.RestClientException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * MLService acts as an advisory helper layer.
 * <p>
 * Important for prototype scope:
 * - This service provides predictions, classifications and scores for insight only.
 * - Core business decisions (assignment, status updates, rewards, etc.) live in non‑ML services.
 * - The system must continue to function even if all ML calls fail.
 */
@Service
public class MLService {

	@Value("${ml.service.url:http://localhost:5005}")
	private String mlServiceUrl;

	private final RestTemplate restTemplate;
	private final MLPredictionRepository mlPredictionRepository;
	private final MLClassificationRepository mlClassificationRepository;
	private final UserEcoScoreRepository userEcoScoreRepository;
	private final WasteRequestRepository wasteRequestRepository;

	public MLService(
		RestTemplate restTemplate,
		MLPredictionRepository mlPredictionRepository,
		MLClassificationRepository mlClassificationRepository,
		UserEcoScoreRepository userEcoScoreRepository,
		WasteRequestRepository wasteRequestRepository
	) {
		this.restTemplate = restTemplate;
		this.mlPredictionRepository = mlPredictionRepository;
		this.mlClassificationRepository = mlClassificationRepository;
		this.userEcoScoreRepository = userEcoScoreRepository;
		this.wasteRequestRepository = wasteRequestRepository;
	}

	/**
	 * Predict waste quantity for a zone
	 */
	public Map<String, Object> predictWasteQuantity(MLPredictionRequestDTO request) {
		try {
			// Prepare request body
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("zoneId", request.getZoneId());
			requestBody.put("historicalWaste", request.getHistoricalWaste());
			if (request.getDayOfWeek() != null) {
				requestBody.put("dayOfWeek", request.getDayOfWeek());
			}
			if (request.getMonth() != null) {
				requestBody.put("month", request.getMonth());
			}

			// Call ML service
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			@SuppressWarnings("unchecked")
			ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
				mlServiceUrl + "/predict/waste",
				entity,
				(Class<Map<String, Object>>) (Class<?>) Map.class
			);

			Map<String, Object> result = response.getBody();
			if (result != null) {
				// Save prediction to database
				MLPrediction prediction = new MLPrediction();
				prediction.setZoneId(request.getZoneId());
				prediction.setPredictedWasteKg(((Number) result.get("predictedWasteKg")).doubleValue());
				prediction.setHistoricalWasteKg(request.getHistoricalWaste());
				prediction.setDayOfWeek(request.getDayOfWeek());
				prediction.setMonth(request.getMonth());
				mlPredictionRepository.save(prediction);
			}

			return result != null ? result : new HashMap<>();
		} catch (RestClientException e) {
			throw new RuntimeException("Failed to call ML service: " + e.getMessage(), e);
		}
	}

	/**
	 * Classify waste type
	 */
	public Map<String, Object> classifyWaste(MLClassificationRequestDTO request) {
		try {
			// Prepare request body
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("description", request.getDescription());
			if (request.getCategory() != null) {
				requestBody.put("category", request.getCategory());
			}

			// Call ML service
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			@SuppressWarnings("unchecked")
			ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
				mlServiceUrl + "/classify/waste",
				entity,
				(Class<Map<String, Object>>) (Class<?>) Map.class
			);

			return response.getBody() != null ? response.getBody() : new HashMap<>();
		} catch (RestClientException e) {
			throw new RuntimeException("Failed to call ML service: " + e.getMessage(), e);
		}
	}

	/**
	 * Classify waste and save to database
	 */
	public MLClassification classifyWasteAndSave(Long requestId, MLClassificationRequestDTO request) {
		Map<String, Object> result = classifyWaste(request);
		
		// Save classification
		MLClassification classification = new MLClassification();
		classification.setRequestId(requestId);
		classification.setWasteType((String) result.get("wasteType"));
		classification.setConfidence(((Number) result.get("confidence")).doubleValue());
		classification.setDescription(request.getDescription());
		
		return mlClassificationRepository.save(classification);
	}

	/**
	 * Calculate user eco score
	 */
	public Map<String, Object> calculateEcoScore(EcoScoreRequestDTO request) {
		try {
			// Prepare request body
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("userId", request.getUserId());
			requestBody.put("userActivity", request.getUserActivity() != null ? request.getUserActivity() : 0);
			requestBody.put("segregationAccuracy", request.getSegregationAccuracy() != null ? request.getSegregationAccuracy() : 0);
			requestBody.put("requestFrequency", request.getRequestFrequency() != null ? request.getRequestFrequency() : 0);
			requestBody.put("avgWeight", request.getAvgWeight() != null ? request.getAvgWeight() : 0);

			// Call ML service
			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			@SuppressWarnings("unchecked")
			ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
				mlServiceUrl + "/score/user",
				entity,
				(Class<Map<String, Object>>) (Class<?>) Map.class
			);

			Map<String, Object> result = response.getBody();
			if (result != null) {
				// Save eco score to database
				UserEcoScore ecoScore = new UserEcoScore();
				ecoScore.setUserId(request.getUserId());
				ecoScore.setEcoScore(((Number) result.get("ecoScore")).intValue());
				
				@SuppressWarnings("unchecked")
				Map<String, Object> breakdown = (Map<String, Object>) result.get("breakdown");
				if (breakdown != null) {
					ecoScore.setActivityScore(((Number) breakdown.get("activityScore")).doubleValue());
					ecoScore.setSegregationScore(((Number) breakdown.get("segregationScore")).doubleValue());
					ecoScore.setFrequencyScore(((Number) breakdown.get("frequencyScore")).intValue());
					ecoScore.setWeightScore(((Number) breakdown.get("weightScore")).intValue());
				}
				
				ecoScore.setUserActivity(request.getUserActivity());
				ecoScore.setSegregationAccuracy(request.getSegregationAccuracy());
				ecoScore.setRequestFrequency(request.getRequestFrequency());
				ecoScore.setAvgWeight(request.getAvgWeight());
				
				userEcoScoreRepository.save(ecoScore);
			}

			return result != null ? result : new HashMap<>();
		} catch (RestClientException e) {
			throw new RuntimeException("Failed to call ML service: " + e.getMessage(), e);
		}
	}

	/**
	 * Calculate and save eco score for a user based on their activity
	 */
	public UserEcoScore calculateEcoScoreForUser(Long userId) {
		// Get user's waste requests
		List<WasteRequest> requests = wasteRequestRepository.findByUserId(userId);
		
		if (requests.isEmpty()) {
			// Return default score for new users
			EcoScoreRequestDTO request = new EcoScoreRequestDTO();
			request.setUserId(userId);
			request.setUserActivity(0);
			request.setSegregationAccuracy(0.0);
			request.setRequestFrequency(0.0);
			request.setAvgWeight(0.0);
			
			calculateEcoScore(request);
			return userEcoScoreRepository.findFirstByUserIdOrderByCalculatedDateDesc(userId)
				.orElse(new UserEcoScore());
		}
		
		// Calculate metrics
		int userActivity = requests.size();
		double totalWeight = requests.stream().mapToDouble(WasteRequest::getWeightKg).sum();
		double avgWeight = totalWeight / userActivity;
		
		// Calculate segregation accuracy (simplified: assume 80% if requests are properly categorized)
		double segregationAccuracy = 80.0; // In production, compare user input vs ML classification
		
		// Calculate request frequency (requests per month)
		LocalDateTime firstRequest = requests.stream()
			.map(WasteRequest::getCreatedAt)
			.min(LocalDateTime::compareTo)
			.orElse(LocalDateTime.now());
		long daysSinceFirst = java.time.temporal.ChronoUnit.DAYS.between(firstRequest, LocalDateTime.now());
		double requestFrequency = daysSinceFirst > 0 ? (userActivity * 30.0 / daysSinceFirst) : userActivity;
		
		// Prepare request
		EcoScoreRequestDTO request = new EcoScoreRequestDTO();
		request.setUserId(userId);
		request.setUserActivity(userActivity);
		request.setSegregationAccuracy(segregationAccuracy);
		request.setRequestFrequency(requestFrequency);
		request.setAvgWeight(avgWeight);
		
		calculateEcoScore(request);
		
		return userEcoScoreRepository.findFirstByUserIdOrderByCalculatedDateDesc(userId)
			.orElse(new UserEcoScore());
	}

	/**
	 * Get zone predictions
	 */
	public List<MLPrediction> getZonePredictions(Long zoneId) {
		return mlPredictionRepository.findByZoneIdOrderByPredictionDateDesc(zoneId);
	}

	/**
	 * Get user's latest eco score
	 */
	public Optional<UserEcoScore> getUserEcoScore(Long userId) {
		return userEcoScoreRepository.findFirstByUserIdOrderByCalculatedDateDesc(userId);
	}
}

