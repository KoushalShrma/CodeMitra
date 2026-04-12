package com.codemitra.backend.repository;

import com.codemitra.backend.model.PerformanceEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for user performance snapshots.
 */
public interface PerformanceRepository extends JpaRepository<PerformanceEntity, Long> {
    Optional<PerformanceEntity> findByUserId(Long userId);
}
