package com.codemitra.backend.repository;

import com.codemitra.backend.model.GroqHintCacheEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for globally shared hint cache entries.
 */
public interface GroqHintCacheRepository extends JpaRepository<GroqHintCacheEntity, Long> {

    Optional<GroqHintCacheEntity> findByProblemIdAndHintNumber(Long problemId, Integer hintNumber);

    @Modifying
    @Query("""
            UPDATE GroqHintCacheEntity h
               SET h.usedCount = h.usedCount + 1,
                   h.lastUsedAt = CURRENT_TIMESTAMP
             WHERE h.problemId = :problemId
               AND h.hintNumber = :hintNumber
            """)
    int incrementUsage(@Param("problemId") Long problemId, @Param("hintNumber") Integer hintNumber);
}
