package com.smartwaste.controller;

import com.smartwaste.dto.*;
import com.smartwaste.service.AnalyticsService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

/**
 * Admin Analytics Controller
 * All endpoints require ADMIN role
 */
@RestController
@RequestMapping("/api/admin/analytics")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAnalyticsController {

	private final AnalyticsService analyticsService;

	public AdminAnalyticsController(AnalyticsService analyticsService) {
		this.analyticsService = analyticsService;
	}

	/**
	 * GET /api/admin/analytics/overview
	 * Get analytics overview with key metrics
	 */
	@GetMapping("/overview")
	public ResponseEntity<AnalyticsOverviewDTO> getOverview(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		// Default to last 30 days if not specified
		if (startDate == null) {
			startDate = LocalDate.now().minusDays(30);
		}
		if (endDate == null) {
			endDate = LocalDate.now();
		}

		AnalyticsOverviewDTO overview = analyticsService.getOverview(startDate, endDate);
		return ResponseEntity.ok(overview);
	}

	/**
	 * GET /api/admin/analytics/waste-by-zone
	 * Get waste distribution by zone
	 */
	@GetMapping("/waste-by-zone")
	public ResponseEntity<List<WasteByZoneDTO>> getWasteByZone(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		List<WasteByZoneDTO> data = analyticsService.getWasteByZone(startDate, endDate);
		return ResponseEntity.ok(data);
	}

	/**
	 * GET /api/admin/analytics/waste-by-type
	 * Get waste breakdown by type
	 */
	@GetMapping("/waste-by-type")
	public ResponseEntity<List<WasteByTypeDTO>> getWasteByType(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		List<WasteByTypeDTO> data = analyticsService.getWasteByType(startDate, endDate);
		return ResponseEntity.ok(data);
	}

	/**
	 * GET /api/admin/analytics/prediction-vs-actual
	 * Get ML prediction vs actual comparison
	 */
	@GetMapping("/prediction-vs-actual")
	public ResponseEntity<List<PredictionVsActualDTO>> getPredictionVsActual(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
		@RequestParam(required = false) Long zoneId
	) {
		List<PredictionVsActualDTO> data = analyticsService.getPredictionVsActual(startDate, endDate, zoneId);
		return ResponseEntity.ok(data);
	}

	/**
	 * GET /api/admin/analytics/collector-performance
	 * Get collector performance metrics
	 */
	@GetMapping("/collector-performance")
	public ResponseEntity<List<CollectorPerformanceDTO>> getCollectorPerformance(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate
	) {
		List<CollectorPerformanceDTO> data = analyticsService.getCollectorPerformance(startDate, endDate);
		return ResponseEntity.ok(data);
	}

	/**
	 * GET /api/admin/analytics/top-eco-users
	 * Get top eco-score users
	 */
	@GetMapping("/top-eco-users")
	public ResponseEntity<List<TopEcoUserDTO>> getTopEcoUsers(
		@RequestParam(defaultValue = "10") int limit
	) {
		List<TopEcoUserDTO> data = analyticsService.getTopEcoUsers(limit);
		return ResponseEntity.ok(data);
	}

}

