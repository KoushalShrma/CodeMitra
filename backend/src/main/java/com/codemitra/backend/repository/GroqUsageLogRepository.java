package com.codemitra.backend.repository;

import com.codemitra.backend.model.GroqUsageLogEntity;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 * Repository for Groq usage telemetry and budget calculations.
 */
public interface GroqUsageLogRepository extends JpaRepository<GroqUsageLogEntity, Long> {

    @Query("""
            SELECT COALESCE(SUM(g.costEstimateUsd), 0)
              FROM GroqUsageLogEntity g
             WHERE g.calledAt >= :start
               AND g.calledAt < :end
            """)
    BigDecimal sumCostBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
