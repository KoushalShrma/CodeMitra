package com.codemitra.backend.repository;

import com.codemitra.backend.model.ProblemAttemptEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for persisted problem attempt telemetry rows.
 */
public interface ProblemAttemptRepository extends JpaRepository<ProblemAttemptEntity, Long> {
    Optional<ProblemAttemptEntity> findTopByUserIdAndProblemIdOrderByUpdatedAtDescIdDesc(Long userId, String problemId);

    List<ProblemAttemptEntity> findByUserId(Long userId);

    List<ProblemAttemptEntity> findByUserIdAndProblemId(Long userId, String problemId);

    List<ProblemAttemptEntity> findByUserIdAndTestId(Long userId, Long testId);

    List<ProblemAttemptEntity> findByTestId(Long testId);

    List<ProblemAttemptEntity> findByProblemIdAndVerdict(String problemId, String verdict);
}
