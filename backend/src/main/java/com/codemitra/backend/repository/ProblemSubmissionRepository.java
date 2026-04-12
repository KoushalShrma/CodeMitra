package com.codemitra.backend.repository;

import com.codemitra.backend.model.ProblemSubmissionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for persisted accepted problem submissions.
 */
public interface ProblemSubmissionRepository extends JpaRepository<ProblemSubmissionEntity, Long> {
    Optional<ProblemSubmissionEntity> findByUserIdAndProblemId(Long userId, String problemId);

    List<ProblemSubmissionEntity> findByUserIdAndCompletedTrue(Long userId);
}
