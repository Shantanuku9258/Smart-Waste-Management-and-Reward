package com.smartwaste.repository;

import com.smartwaste.entity.WasteRequest;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface WasteRequestRepository extends JpaRepository<WasteRequest, Long> {
	List<WasteRequest> findByUserId(Long userId);
	List<WasteRequest> findByCollectorId(Long collectorId);
	
	// Pagination support
	Page<WasteRequest> findByUserId(Long userId, Pageable pageable);
	Page<WasteRequest> findByCollectorId(Long collectorId, Pageable pageable);
	Page<WasteRequest> findByZoneId(Long zoneId, Pageable pageable);
	Page<WasteRequest> findByStatus(String status, Pageable pageable);
	
	// Optimized queries with pagination
	@Query("SELECT wr FROM WasteRequest wr WHERE wr.userId = :userId AND wr.status = :status")
	Page<WasteRequest> findByUserIdAndStatus(@Param("userId") Long userId, @Param("status") String status, Pageable pageable);
	
	@Query("SELECT wr FROM WasteRequest wr WHERE wr.collectorId = :collectorId AND wr.status = :status")
	Page<WasteRequest> findByCollectorIdAndStatus(@Param("collectorId") Long collectorId, @Param("status") String status, Pageable pageable);
}
