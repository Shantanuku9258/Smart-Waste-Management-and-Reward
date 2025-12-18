package com.smartwaste.repository;

import com.smartwaste.entity.UserEcoScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;
import java.util.List;

@Repository
public interface UserEcoScoreRepository extends JpaRepository<UserEcoScore, Long> {
	Optional<UserEcoScore> findFirstByUserIdOrderByCalculatedDateDesc(Long userId);
	List<UserEcoScore> findByUserIdOrderByCalculatedDateDesc(Long userId);
}

