package com.codemitra.backend.repository;

import com.codemitra.backend.model.ScraperRunLogEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for scraper execution logs.
 */
public interface ScraperRunLogRepository extends JpaRepository<ScraperRunLogEntity, Long> {

    Optional<ScraperRunLogEntity> findTopBySourceIdOrderByRunStartedAtDesc(Long sourceId);
}
