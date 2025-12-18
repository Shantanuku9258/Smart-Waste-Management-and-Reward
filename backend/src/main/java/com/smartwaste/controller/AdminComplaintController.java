package com.smartwaste.controller;

import com.smartwaste.entity.Complaint;
import com.smartwaste.repository.ComplaintRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/complaints")
@PreAuthorize("hasRole('ADMIN')")
public class AdminComplaintController {

	private final ComplaintRepository complaintRepository;

	public AdminComplaintController(ComplaintRepository complaintRepository) {
		this.complaintRepository = complaintRepository;
	}

	@GetMapping
	public ResponseEntity<List<Complaint>> getAll() {
		return ResponseEntity.ok(complaintRepository.findAll());
	}
}


