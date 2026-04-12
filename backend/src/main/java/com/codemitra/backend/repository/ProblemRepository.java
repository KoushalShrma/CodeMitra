package com.codemitra.backend.repository;

import com.codemitra.backend.model.ProblemEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

/**
 * Repository for canonical problem records populated by scraper and practice hydration paths.
 */
public interface ProblemRepository extends JpaRepository<ProblemEntity, Long> {

    Optional<ProblemEntity> findByProblemKey(String problemKey);

    Optional<ProblemEntity> findByScrapeHash(String scrapeHash);

    List<ProblemEntity> findByIsVerifiedTrueOrderByUpdatedAtDescIdDesc();

    @Query(value = """
            SELECT p.*
            FROM problems p
            LEFT JOIN groq_hint_cache gh
              ON gh.problem_id = p.id
             AND gh.hint_number = 1
            WHERE gh.id IS NULL
            ORDER BY p.created_at ASC
            LIMIT 200
            """, nativeQuery = true)
    List<ProblemEntity> findWithoutHint1Cache();
}
