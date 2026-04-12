package com.codemitra.backend.repository;

import com.codemitra.backend.model.ProblemProgressEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for user progress state per problem.
 */
public interface ProblemProgressRepository extends JpaRepository<ProblemProgressEntity, Long> {
    Optional<ProblemProgressEntity> findByUserIdAndProblemId(Long userId, String problemId);

    long countByUserIdAndStatus(Long userId, String status);
}
