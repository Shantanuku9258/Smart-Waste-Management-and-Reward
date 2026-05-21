package com.smartwaste.service;

import com.smartwaste.dto.EcoScoreRequestDTO;
import com.smartwaste.dto.EwastePredictionRequestDTO;
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

	// ── Safe number extractors — prevent NPE when Flask key is missing or null ──

	private double safeDouble(Map<String, Object> map, String key, double fallback) {
		if (map == null) return fallback;
		Object v = map.get(key);
		return v instanceof Number ? ((Number) v).doubleValue() : fallback;
	}

	private int safeInt(Map<String, Object> map, String key, int fallback) {
		if (map == null) return fallback;
		Object v = map.get(key);
		return v instanceof Number ? ((Number) v).intValue() : fallback;
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
			if (result != null && result.containsKey("predictedWasteKg")) {
				// Save prediction to database
				MLPrediction prediction = new MLPrediction();
				prediction.setZoneId(request.getZoneId());
				prediction.setPredictedWasteKg(safeDouble(result, "predictedWasteKg", 0.0));
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

		MLClassification classification = new MLClassification();
		classification.setRequestId(requestId);
		// Guard: wasteType or confidence may be absent if model not loaded
		Object wt = result.get("wasteType");
		classification.setWasteType(wt instanceof String ? (String) wt : null);
		classification.setConfidence(safeDouble(result, "confidence", 0.0));
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
			if (result != null && result.containsKey("ecoScore")) {
				UserEcoScore ecoScore = new UserEcoScore();
				ecoScore.setUserId(request.getUserId());
				ecoScore.setEcoScore(safeInt(result, "ecoScore", 0));

				@SuppressWarnings("unchecked")
				Map<String, Object> breakdown = (result.get("breakdown") instanceof Map)
					? (Map<String, Object>) result.get("breakdown") : null;

				if (breakdown != null) {
					ecoScore.setActivityScore(safeDouble(breakdown, "activityScore", 0.0));
					ecoScore.setSegregationScore(safeDouble(breakdown, "segregationScore", 0.0));
					ecoScore.setFrequencyScore(safeInt(breakdown, "frequencyScore", 0));
					ecoScore.setWeightScore(safeInt(breakdown, "weightScore", 0));
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

	/**
	 * Save or update E-waste prediction
	 */
	private void saveEwastePrediction(String state, Integer year, Integer month, Double predictedGeneration, String demandLevel, String priorityLevel) {
		try {
			MLPrediction prediction = mlPredictionRepository
				.findFirstByStateAndYearAndMonthOrderByPredictionDateDesc(state, year, month)
				.orElse(new MLPrediction());

			prediction.setState(state);
			prediction.setYear(year);
			prediction.setMonth(month);

			if (predictedGeneration != null) {
				prediction.setPredictedGeneration(predictedGeneration);
			}
			if (demandLevel != null) {
				prediction.setDemandLevel(demandLevel);
			}
			if (priorityLevel != null) {
				prediction.setPriorityLevel(priorityLevel);
			}

			mlPredictionRepository.save(prediction);
		} catch (Exception e) {
			// Advisory persistence must not block ML API responses
			org.slf4j.LoggerFactory.getLogger(MLService.class)
				.warn("Failed to persist e-waste prediction for {} {}-{}: {}", state, year, month, e.getMessage());
		}
	}

	/**
	 * Predict e-waste generation
	 */
	public Map<String, Object> predictEwasteGeneration(EwastePredictionRequestDTO request) {
		try {
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("state", request.getState());
			requestBody.put("year", request.getYear());
			requestBody.put("month", request.getMonth());
			requestBody.put("collection_centres", request.getCollectionCentres());

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			@SuppressWarnings("unchecked")
			ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
				mlServiceUrl + "/predict/ewaste-generation",
				entity,
				(Class<Map<String, Object>>) (Class<?>) Map.class
			);

			Map<String, Object> result = response.getBody();
			if (result != null && result.containsKey("predictedGeneration")) {
				saveEwastePrediction(
					request.getState(),
					request.getYear(),
					request.getMonth(),
					safeDouble(result, "predictedGeneration", 0.0),
					null,
					null
				);
			}

			return result != null ? result : new HashMap<>();
		} catch (RestClientException e) {
			throw new RuntimeException("Failed to call ML service for e-waste generation: " + e.getMessage(), e);
		}
	}

	/**
	 * Predict e-waste demand
	 */
	public Map<String, Object> predictEwasteDemand(EwastePredictionRequestDTO request) {
		try {
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("state", request.getState());
			requestBody.put("year", request.getYear());
			requestBody.put("month", request.getMonth());
			requestBody.put("collection_centres", request.getCollectionCentres());

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			@SuppressWarnings("unchecked")
			ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
				mlServiceUrl + "/predict/ewaste-demand",
				entity,
				(Class<Map<String, Object>>) (Class<?>) Map.class
			);

			Map<String, Object> result = response.getBody();
			if (result != null) {
				saveEwastePrediction(
					request.getState(), 
					request.getYear(), 
					request.getMonth(), 
					null, 
					(String) result.get("demandLevel"), 
					null
				);
			}

			return result != null ? result : new HashMap<>();
		} catch (RestClientException e) {
			throw new RuntimeException("Failed to call ML service for e-waste demand: " + e.getMessage(), e);
		}
	}

	/**
	 * Predict e-waste priority
	 */
	public Map<String, Object> predictEwastePriority(EwastePredictionRequestDTO request) {
		try {
			Map<String, Object> requestBody = new HashMap<>();
			requestBody.put("state", request.getState());
			requestBody.put("year", request.getYear());
			requestBody.put("month", request.getMonth());
			requestBody.put("collection_centres", request.getCollectionCentres());

			HttpHeaders headers = new HttpHeaders();
			headers.setContentType(MediaType.APPLICATION_JSON);
			HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

			@SuppressWarnings("unchecked")
			ResponseEntity<Map<String, Object>> response = restTemplate.postForEntity(
				mlServiceUrl + "/predict/ewaste-priority",
				entity,
				(Class<Map<String, Object>>) (Class<?>) Map.class
			);

			Map<String, Object> result = response.getBody();
			if (result != null) {
				saveEwastePrediction(
					request.getState(), 
					request.getYear(), 
					request.getMonth(), 
					null, 
					null, 
					(String) result.get("priorityLevel")
				);
			}

			return result != null ? result : new HashMap<>();
		} catch (RestClientException e) {
			throw new RuntimeException("Failed to call ML service for e-waste priority: " + e.getMessage(), e);
		}
	}
}

