package com.smartwaste.controller;

import com.smartwaste.config.RateLimitingConfig;
import com.smartwaste.service.ReportService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

/**
 * Admin Reports Controller
 * All endpoints require ADMIN role
 * Includes rate limiting for report downloads
 */
@RestController
@RequestMapping("/api/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReportsController {

	private static final Logger logger = LoggerFactory.getLogger(AdminReportsController.class);

	private final ReportService reportService;
	private final RateLimitingConfig rateLimitingConfig;

	public AdminReportsController(ReportService reportService, RateLimitingConfig rateLimitingConfig) {
		this.reportService = reportService;
		this.rateLimitingConfig = rateLimitingConfig;
	}

	/**
	 * GET /api/admin/reports/waste
	 * Download waste report as CSV
	 */
	@GetMapping("/waste")
	public ResponseEntity<?> downloadWasteReport(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
		@RequestParam(required = false) Long zoneId,
		@RequestParam(required = false) String wasteType,
		HttpServletRequest request
	) {
		String clientId = getClientId(request);

		// Rate limiting check
		if (!rateLimitingConfig.isReportAllowed(clientId)) {
			logger.warn("Report download rate limit exceeded for client: {}", clientId);
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(java.util.Map.of("message", "Too many report requests. Please try again later."));
		}

		logger.info("Waste report download requested by client: {}", clientId);

		byte[] csvData = reportService.generateWasteReportCSV(startDate, endDate, zoneId, wasteType);

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.parseMediaType("text/csv"));
		headers.setContentDispositionFormData("attachment", "waste_report_" + LocalDate.now() + ".csv");

		return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
	}

	/**
	 * GET /api/admin/reports/users
	 * Download users report as CSV
	 */
	@GetMapping("/users")
	public ResponseEntity<?> downloadUsersReport(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
		HttpServletRequest request
	) {
		String clientId = getClientId(request);

		if (!rateLimitingConfig.isReportAllowed(clientId)) {
			logger.warn("Report download rate limit exceeded for client: {}", clientId);
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(java.util.Map.of("message", "Too many report requests. Please try again later."));
		}

		logger.info("Users report download requested by client: {}", clientId);

		byte[] csvData = reportService.generateUsersReportCSV(startDate, endDate);

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.parseMediaType("text/csv"));
		headers.setContentDispositionFormData("attachment", "users_report_" + LocalDate.now() + ".csv");

		return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
	}

	/**
	 * GET /api/admin/reports/collectors
	 * Download collectors report as CSV
	 */
	@GetMapping("/collectors")
	public ResponseEntity<?> downloadCollectorsReport(
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
		@RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
		HttpServletRequest request
	) {
		String clientId = getClientId(request);

		if (!rateLimitingConfig.isReportAllowed(clientId)) {
			logger.warn("Report download rate limit exceeded for client: {}", clientId);
			return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
				.body(java.util.Map.of("message", "Too many report requests. Please try again later."));
		}

		logger.info("Collectors report download requested by client: {}", clientId);

		byte[] csvData = reportService.generateCollectorsReportCSV(startDate, endDate);

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.parseMediaType("text/csv"));
		headers.setContentDispositionFormData("attachment", "collectors_report_" + LocalDate.now() + ".csv");

		return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
	}

	private String getClientId(HttpServletRequest request) {
		String xForwardedFor = request.getHeader("X-Forwarded-For");
		if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
			return xForwardedFor.split(",")[0].trim();
		}
		return request.getRemoteAddr();
	}
}
