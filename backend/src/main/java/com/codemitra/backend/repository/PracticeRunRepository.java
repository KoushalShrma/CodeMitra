package com.codemitra.backend.repository;

import com.codemitra.backend.model.PracticeRunEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for per-run coding attempt history.
 */
public interface PracticeRunRepository extends JpaRepository<PracticeRunEntity, Long> {
    List<PracticeRunEntity> findByUserIdAndProblemIdOrderByCreatedAtAscIdAsc(Long userId, String problemId);

    List<PracticeRunEntity> findTop8ByUserIdOrderByCreatedAtDesc(Long userId);

    List<PracticeRunEntity> findByUserId(Long userId);
}
