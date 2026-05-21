package com.smartwaste.repository;

import com.smartwaste.entity.MLPrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface MLPredictionRepository extends JpaRepository<MLPrediction, Long> {
	List<MLPrediction> findByZoneIdOrderByPredictionDateDesc(Long zoneId);
	List<MLPrediction> findByZoneId(Long zoneId);
	Optional<MLPrediction> findFirstByStateAndYearAndMonthOrderByPredictionDateDesc(
		String state, Integer year, Integer month);
}

