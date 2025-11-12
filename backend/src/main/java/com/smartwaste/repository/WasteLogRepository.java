package com.smartwaste.repository;

import com.smartwaste.entity.WasteLog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface WasteLogRepository extends JpaRepository<WasteLog, Long> {
}


