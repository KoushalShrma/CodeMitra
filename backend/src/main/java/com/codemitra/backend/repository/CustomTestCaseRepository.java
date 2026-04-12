package com.codemitra.backend.repository;

import com.codemitra.backend.model.CustomTestCaseEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for test cases attached to institution custom problems.
 */
public interface CustomTestCaseRepository extends JpaRepository<CustomTestCaseEntity, Long> {
    List<CustomTestCaseEntity> findByProblemIdOrderByIdAsc(Long problemId);
}
