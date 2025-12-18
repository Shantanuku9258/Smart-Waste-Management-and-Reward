package com.smartwaste.repository;

import com.smartwaste.entity.Complaint;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ComplaintRepository extends JpaRepository<Complaint, Long> {
	List<Complaint> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}


