package com.smartwaste.repository;

import com.smartwaste.entity.WasteRequest;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WasteRequestRepository extends JpaRepository<WasteRequest, Long> {
	List<WasteRequest> findByUserId(Long userId);
	List<WasteRequest> findByCollectorId(Long collectorId);
}


