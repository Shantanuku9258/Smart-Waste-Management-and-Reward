package com.smartwaste.repository;

import com.smartwaste.entity.MLClassification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface MLClassificationRepository extends JpaRepository<MLClassification, Long> {
	Optional<MLClassification> findByRequestId(Long requestId);
}

