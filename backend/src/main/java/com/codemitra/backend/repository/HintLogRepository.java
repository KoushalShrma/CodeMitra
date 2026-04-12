package com.codemitra.backend.repository;

import com.codemitra.backend.model.HintLogEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for AI hint usage history.
 */
public interface HintLogRepository extends JpaRepository<HintLogEntity, Long> {
    List<HintLogEntity> findByUserIdAndProblemIdOrderByRequestedAtAsc(Long userId, String problemId);

    long countByUserIdAndProblemId(Long userId, String problemId);
}
