package com.smartwaste.repository;

import com.smartwaste.entity.RewardTransaction;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RewardTransactionRepository extends JpaRepository<RewardTransaction, Long> {
	Optional<RewardTransaction> findByRequestId(Long requestId);
	List<RewardTransaction> findByUser_UserIdOrderByCreatedAtDesc(Long userId);
}


