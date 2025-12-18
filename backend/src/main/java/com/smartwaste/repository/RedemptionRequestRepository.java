package com.smartwaste.repository;

import com.smartwaste.entity.RedemptionRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RedemptionRequestRepository extends JpaRepository<RedemptionRequest, Long> {

	List<RedemptionRequest> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}



