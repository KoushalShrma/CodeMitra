package com.codemitra.backend.repository;

import com.codemitra.backend.model.GroqCacheStatsEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for cache hit/miss aggregate counters.
 */
public interface GroqCacheStatsRepository extends JpaRepository<GroqCacheStatsEntity, Long> {

    Optional<GroqCacheStatsEntity> findByCacheKey(String cacheKey);
}
