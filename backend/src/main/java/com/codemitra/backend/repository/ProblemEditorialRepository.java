package com.codemitra.backend.repository;

import com.codemitra.backend.model.ProblemEditorialEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for high-level editorial cache payloads.
 */
public interface ProblemEditorialRepository extends JpaRepository<ProblemEditorialEntity, Long> {

    Optional<ProblemEditorialEntity> findByProblemId(Long problemId);
}
