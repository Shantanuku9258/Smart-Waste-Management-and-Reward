package com.smartwaste.service;

import com.smartwaste.dto.*;
import com.smartwaste.entity.*;
import com.smartwaste.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class AnalyticsService {

	private final WasteRequestRepository wasteRequestRepository;
	private final UserRepository userRepository;
	private final CollectorRepository collectorRepository;
	private final ZoneRepository zoneRepository;
	private final MLPredictionRepository mlPredictionRepository;
	private final UserEcoScoreRepository userEcoScoreRepository;

	public AnalyticsService(
		WasteRequestRepository wasteRequestRepository,
		UserRepository userRepository,
		CollectorRepository collectorRepository,
		ZoneRepository zoneRepository,
		MLPredictionRepository mlPredictionRepository,
		UserEcoScoreRepository userEcoScoreRepository
	) {
		this.wasteRequestRepository = wasteRequestRepository;
		this.userRepository = userRepository;
		this.collectorRepository = collectorRepository;
		this.zoneRepository = zoneRepository;
		this.mlPredictionRepository = mlPredictionRepository;
		this.userEcoScoreRepository = userEcoScoreRepository;
	}

	/**
	 * Get analytics overview with key metrics
	 */
	public AnalyticsOverviewDTO getOverview(LocalDate startDate, LocalDate endDate) {
		AnalyticsOverviewDTO overview = new AnalyticsOverviewDTO();
		overview.setPeriodStart(startDate);
		overview.setPeriodEnd(endDate);

		LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
		LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

		// Total waste collected (only COLLECTED requests)
		List<WasteRequest> collectedRequests = wasteRequestRepository.findAll().stream()
			.filter(req -> "COLLECTED".equals(req.getStatus()))
			.filter(req -> start == null || req.getCollectedTime() == null || !req.getCollectedTime().isBefore(start))
			.filter(req -> end == null || req.getCollectedTime() == null || !req.getCollectedTime().isAfter(end))
			.collect(Collectors.toList());

		double totalWaste = collectedRequests.stream()
			.mapToDouble(WasteRequest::getWeightKg)
			.sum();
		overview.setTotalWasteCollected(totalWaste);

		// Total requests (filtered by date if provided)
		List<WasteRequest> allRequests = wasteRequestRepository.findAll().stream()
			.filter(req -> start == null || req.getCreatedAt() == null || !req.getCreatedAt().isBefore(start))
			.filter(req -> end == null || req.getCreatedAt() == null || !req.getCreatedAt().isAfter(end))
			.collect(Collectors.toList());
		overview.setTotalRequests(allRequests.size());

		// Total users
		long totalUsers = userRepository.count();
		overview.setTotalUsers((int) totalUsers);

		// Total collectors
		long totalCollectors = collectorRepository.count();
		overview.setTotalCollectors((int) totalCollectors);

		// Average eco score
		List<UserEcoScore> latestScores = userEcoScoreRepository.findAll().stream()
			.collect(Collectors.groupingBy(UserEcoScore::getUserId))
			.values().stream()
			.map(scores -> scores.stream()
				.max((a, b) -> a.getCalculatedDate().compareTo(b.getCalculatedDate()))
				.orElse(null))
			.filter(score -> score != null && score.getEcoScore() != null)
			.collect(Collectors.toList());

		if (!latestScores.isEmpty()) {
			double avgScore = latestScores.stream()
				.mapToInt(UserEcoScore::getEcoScore)
				.average()
				.orElse(0.0);
			overview.setAverageEcoScore(avgScore);
		}

		// Prediction accuracy (simplified calculation)
		// Compare recent predictions with actual collected waste
		List<MLPrediction> recentPredictions = mlPredictionRepository.findAll().stream()
			.filter(pred -> pred.getPredictionDate() != null)
			.filter(pred -> start == null || !pred.getPredictionDate().isBefore(start))
			.filter(pred -> end == null || !pred.getPredictionDate().isAfter(end))
			.collect(Collectors.toList());

		if (!recentPredictions.isEmpty()) {
			double totalPredicted = recentPredictions.stream()
				.mapToDouble(p -> p.getPredictedWasteKg() != null ? p.getPredictedWasteKg() : 0.0)
				.sum();

			// Get actual waste for same zones and period
			double totalActual = collectedRequests.stream()
				.mapToDouble(WasteRequest::getWeightKg)
				.sum();

			if (totalPredicted > 0) {
				double accuracy = Math.min(100.0, (1.0 - Math.abs(totalPredicted - totalActual) / totalPredicted) * 100.0);
				overview.setPredictionAccuracy(Math.max(0.0, accuracy));
			}
		}

		return overview;
	}

	/**
	 * Get waste distribution by zone
	 */
	public List<WasteByZoneDTO> getWasteByZone(LocalDate startDate, LocalDate endDate) {
		LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
		LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

		List<WasteRequest> collectedRequests = wasteRequestRepository.findAll().stream()
			.filter(req -> "COLLECTED".equals(req.getStatus()))
			.filter(req -> req.getZoneId() != null)
			.filter(req -> start == null || req.getCollectedTime() == null || !req.getCollectedTime().isBefore(start))
			.filter(req -> end == null || req.getCollectedTime() == null || !req.getCollectedTime().isAfter(end))
			.collect(Collectors.toList());

		return collectedRequests.stream()
			.collect(Collectors.groupingBy(WasteRequest::getZoneId))
			.entrySet().stream()
			.map(entry -> {
				Long zoneId = entry.getKey();
				List<WasteRequest> zoneRequests = entry.getValue();

				Zone zone = zoneRepository.findById(zoneId).orElse(null);
				String zoneName = zone != null ? zone.getZoneName() : "Zone " + zoneId;

				double totalWaste = zoneRequests.stream()
					.mapToDouble(WasteRequest::getWeightKg)
					.sum();
				int requestCount = zoneRequests.size();
				double avgWeight = requestCount > 0 ? totalWaste / requestCount : 0.0;

				return new WasteByZoneDTO(zoneId, zoneName, totalWaste, requestCount, avgWeight);
			})
			.collect(Collectors.toList());
	}

	/**
	 * Get waste breakdown by type
	 */
	public List<WasteByTypeDTO> getWasteByType(LocalDate startDate, LocalDate endDate) {
		LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
		LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

		List<WasteRequest> collectedRequests = wasteRequestRepository.findAll().stream()
			.filter(req -> "COLLECTED".equals(req.getStatus()))
			.filter(req -> req.getWasteType() != null)
			.filter(req -> start == null || req.getCollectedTime() == null || !req.getCollectedTime().isBefore(start))
			.filter(req -> end == null || req.getCollectedTime() == null || !req.getCollectedTime().isAfter(end))
			.collect(Collectors.toList());

		double totalWaste = collectedRequests.stream()
			.mapToDouble(WasteRequest::getWeightKg)
			.sum();

		return collectedRequests.stream()
			.collect(Collectors.groupingBy(WasteRequest::getWasteType))
			.entrySet().stream()
			.map(entry -> {
				String wasteType = entry.getKey();
				List<WasteRequest> typeRequests = entry.getValue();

				double typeWaste = typeRequests.stream()
					.mapToDouble(WasteRequest::getWeightKg)
					.sum();
				int requestCount = typeRequests.size();
				double percentage = totalWaste > 0 ? (typeWaste / totalWaste) * 100.0 : 0.0;

				return new WasteByTypeDTO(wasteType, typeWaste, requestCount, percentage);
			})
			.collect(Collectors.toList());
	}

	/**
	 * Get ML prediction vs actual comparison
	 */
	public List<PredictionVsActualDTO> getPredictionVsActual(LocalDate startDate, LocalDate endDate, Long zoneId) {
		LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
		LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

		List<MLPrediction> predictions = mlPredictionRepository.findAll().stream()
			.filter(pred -> zoneId == null || pred.getZoneId().equals(zoneId))
			.filter(pred -> pred.getPredictionDate() != null)
			.filter(pred -> start == null || !pred.getPredictionDate().isBefore(start))
			.filter(pred -> end == null || !pred.getPredictionDate().isAfter(end))
			.collect(Collectors.toList());

		return predictions.stream()
			.map(pred -> {
				LocalDate predDate = pred.getPredictionDate().toLocalDate();
				Long predZoneId = pred.getZoneId();

				// Get actual waste for same date and zone
				double actualWaste = wasteRequestRepository.findAll().stream()
					.filter(req -> "COLLECTED".equals(req.getStatus()))
					.filter(req -> predZoneId.equals(req.getZoneId()))
					.filter(req -> req.getCollectedTime() != null)
					.filter(req -> req.getCollectedTime().toLocalDate().equals(predDate))
					.mapToDouble(WasteRequest::getWeightKg)
					.sum();

				double predictedWaste = pred.getPredictedWasteKg() != null ? pred.getPredictedWasteKg() : 0.0;
				double difference = predictedWaste - actualWaste;
				double accuracy = predictedWaste > 0 
					? Math.max(0.0, Math.min(100.0, (1.0 - Math.abs(difference) / predictedWaste) * 100.0))
					: 0.0;

				Zone zone = zoneRepository.findById(predZoneId).orElse(null);
				String zoneName = zone != null ? zone.getZoneName() : "Zone " + predZoneId;

				PredictionVsActualDTO dto = new PredictionVsActualDTO();
				dto.setDate(predDate);
				dto.setZoneId(predZoneId);
				dto.setZoneName(zoneName);
				dto.setPredictedWasteKg(predictedWaste);
				dto.setActualWasteKg(actualWaste);
				dto.setDifference(difference);
				dto.setAccuracyPercentage(accuracy);
				return dto;
			})
			.collect(Collectors.toList());
	}

	/**
	 * Get collector performance metrics
	 */
	public List<CollectorPerformanceDTO> getCollectorPerformance(LocalDate startDate, LocalDate endDate) {
		LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
		LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

		List<Collector> collectors = collectorRepository.findAll();

		return collectors.stream()
			.map(collector -> {
				List<WasteRequest> collectorRequests = wasteRequestRepository.findByCollectorId(collector.getCollectorId())
					.stream()
					.filter(req -> start == null || req.getCreatedAt() == null || !req.getCreatedAt().isBefore(start))
					.filter(req -> end == null || req.getCreatedAt() == null || !req.getCreatedAt().isAfter(end))
					.collect(Collectors.toList());

				List<WasteRequest> completed = collectorRequests.stream()
					.filter(req -> "COLLECTED".equals(req.getStatus()))
					.collect(Collectors.toList());

				List<WasteRequest> pending = collectorRequests.stream()
					.filter(req -> "PENDING".equals(req.getStatus()) || "IN_PROGRESS".equals(req.getStatus()))
					.collect(Collectors.toList());

				double totalWaste = completed.stream()
					.mapToDouble(WasteRequest::getWeightKg)
					.sum();
				int completedCount = completed.size();
				double avgWeight = completedCount > 0 ? totalWaste / completedCount : 0.0;
				int totalRequests = collectorRequests.size();
				double completionRate = totalRequests > 0 ? (completedCount * 100.0 / totalRequests) : 0.0;

				Zone zone = collector.getZone();
				Long zoneId = zone != null ? zone.getZoneId() : null;
				String zoneName = zone != null ? zone.getZoneName() : "N/A";

				CollectorPerformanceDTO dto = new CollectorPerformanceDTO();
				dto.setCollectorId(collector.getCollectorId());
				dto.setCollectorName(collector.getName());
				dto.setEmail(collector.getEmail());
				dto.setZoneId(zoneId);
				dto.setZoneName(zoneName);
				dto.setTotalCollections(completedCount);
				dto.setTotalWasteCollectedKg(totalWaste);
				dto.setAverageWeightPerCollection(avgWeight);
				dto.setCompletedRequests(completedCount);
				dto.setPendingRequests(pending.size());
				dto.setCompletionRate(completionRate);
				return dto;
			})
			.collect(Collectors.toList());
	}

	/**
	 * Get top eco-score users
	 */
	public List<TopEcoUserDTO> getTopEcoUsers(int limit) {
		return userEcoScoreRepository.findAll().stream()
			.collect(Collectors.groupingBy(UserEcoScore::getUserId))
			.values().stream()
			.map(scores -> scores.stream()
				.max((a, b) -> a.getCalculatedDate().compareTo(b.getCalculatedDate()))
				.orElse(null))
			.filter(score -> score != null && score.getEcoScore() != null)
			.sorted((a, b) -> Integer.compare(b.getEcoScore(), a.getEcoScore()))
			.limit(limit > 0 ? limit : 10)
			.map(score -> {
				User user = userRepository.findById(score.getUserId()).orElse(null);
				if (user == null) return null;

				// Get user's request stats
				List<WasteRequest> userRequests = wasteRequestRepository.findByUserId(score.getUserId());
				int totalRequests = userRequests.size();
				double totalWaste = userRequests.stream()
					.mapToDouble(WasteRequest::getWeightKg)
					.sum();
				double avgWeight = totalRequests > 0 ? totalWaste / totalRequests : 0.0;

				TopEcoUserDTO dto = new TopEcoUserDTO();
				dto.setUserId(score.getUserId());
				dto.setUserName(user.getName());
				dto.setEmail(user.getEmail());
				dto.setEcoScore(score.getEcoScore());
				dto.setTotalRequests(totalRequests);
				dto.setTotalWasteKg(totalWaste);
				dto.setAverageWeight(avgWeight);
				dto.setRequestFrequency(score.getRequestFrequency());
				return dto;
			})
			.filter(dto -> dto != null)
			.collect(Collectors.toList());
	}
}

