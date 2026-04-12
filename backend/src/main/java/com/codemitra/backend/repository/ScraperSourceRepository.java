package com.codemitra.backend.repository;

import com.codemitra.backend.model.ScraperSourceEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for scraper source configuration and health metadata.
 */
public interface ScraperSourceRepository extends JpaRepository<ScraperSourceEntity, Long> {

    Optional<ScraperSourceEntity> findByNameIgnoreCase(String name);

    List<ScraperSourceEntity> findByIsActiveTrueOrderByIdAsc();
}
