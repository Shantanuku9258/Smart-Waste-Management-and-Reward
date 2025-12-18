package com.smartwaste.service;

import com.smartwaste.dto.*;
import com.smartwaste.entity.WasteRequest;
import com.smartwaste.repository.*;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class ReportService {

	private final WasteRequestRepository wasteRequestRepository;
	private final AnalyticsService analyticsService;

	public ReportService(
		WasteRequestRepository wasteRequestRepository,
		AnalyticsService analyticsService
	) {
		this.wasteRequestRepository = wasteRequestRepository;
		this.analyticsService = analyticsService;
	}

	/**
	 * Generate waste report CSV
	 */
	public byte[] generateWasteReportCSV(LocalDate startDate, LocalDate endDate, Long zoneId, String wasteType) {
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		
		try (PrintWriter writer = new PrintWriter(outputStream);
			 CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

			// Header
			csvPrinter.printRecord("Request ID", "User ID", "Zone ID", "Waste Type", "Weight (kg)", 
				"Status", "Collected Date", "Reward Points");

			// Filter requests
			LocalDateTime start = startDate != null ? startDate.atStartOfDay() : null;
			LocalDateTime end = endDate != null ? endDate.atTime(23, 59, 59) : null;

			List<WasteRequest> requests = wasteRequestRepository.findAll().stream()
				.filter(req -> zoneId == null || zoneId.equals(req.getZoneId()))
				.filter(req -> wasteType == null || wasteType.equals(req.getWasteType()))
				.filter(req -> start == null || req.getCreatedAt() == null || !req.getCreatedAt().isBefore(start))
				.filter(req -> end == null || req.getCreatedAt() == null || !req.getCreatedAt().isAfter(end))
				.collect(Collectors.toList());

			// Data rows
			for (WasteRequest req : requests) {
				csvPrinter.printRecord(
					req.getRequestId(),
					req.getUserId(),
					req.getZoneId(),
					req.getWasteType(),
					req.getWeightKg(),
					req.getStatus(),
					req.getCollectedTime() != null ? req.getCollectedTime().toString() : "",
					req.getRewardPoints()
				);
			}

			csvPrinter.flush();
		} catch (IOException e) {
			throw new RuntimeException("Failed to generate CSV report", e);
		}

		return outputStream.toByteArray();
	}

	/**
	 * Generate users report CSV
	 */
	public byte[] generateUsersReportCSV(LocalDate startDate, LocalDate endDate) {
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		
		try (PrintWriter writer = new PrintWriter(outputStream);
			 CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

			// Header
			csvPrinter.printRecord("User ID", "Name", "Email", "Role", "Total Points", 
				"Total Requests", "Total Waste (kg)", "Average Weight (kg)", "Eco Score");

			// Get top users with analytics
			List<TopEcoUserDTO> topUsers = analyticsService.getTopEcoUsers(1000); // Get all users

			// Data rows
			for (TopEcoUserDTO user : topUsers) {
				csvPrinter.printRecord(
					user.getUserId(),
					user.getUserName(),
					user.getEmail(),
					"USER",
					"", // Points would need to be fetched separately
					user.getTotalRequests(),
					user.getTotalWasteKg(),
					user.getAverageWeight(),
					user.getEcoScore()
				);
			}

			csvPrinter.flush();
		} catch (IOException e) {
			throw new RuntimeException("Failed to generate CSV report", e);
		}

		return outputStream.toByteArray();
	}

	/**
	 * Generate collectors report CSV
	 */
	public byte[] generateCollectorsReportCSV(LocalDate startDate, LocalDate endDate) {
		ByteArrayOutputStream outputStream = new ByteArrayOutputStream();
		
		try (PrintWriter writer = new PrintWriter(outputStream);
			 CSVPrinter csvPrinter = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

			// Header
			csvPrinter.printRecord("Collector ID", "Name", "Email", "Zone ID", "Zone Name",
				"Total Collections", "Total Waste (kg)", "Average Weight (kg)", 
				"Completed Requests", "Pending Requests", "Completion Rate (%)");

			// Get collector performance
			List<CollectorPerformanceDTO> performance = analyticsService.getCollectorPerformance(startDate, endDate);

			// Data rows
			for (CollectorPerformanceDTO perf : performance) {
				csvPrinter.printRecord(
					perf.getCollectorId(),
					perf.getCollectorName(),
					perf.getEmail(),
					perf.getZoneId(),
					perf.getZoneName(),
					perf.getTotalCollections(),
					perf.getTotalWasteCollectedKg(),
					perf.getAverageWeightPerCollection(),
					perf.getCompletedRequests(),
					perf.getPendingRequests(),
					perf.getCompletionRate()
				);
			}

			csvPrinter.flush();
		} catch (IOException e) {
			throw new RuntimeException("Failed to generate CSV report", e);
		}

		return outputStream.toByteArray();
	}
}

