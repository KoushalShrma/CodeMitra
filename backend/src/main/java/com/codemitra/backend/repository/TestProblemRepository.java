package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestProblemEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for ordered test-problem assignment rows.
 */
public interface TestProblemRepository extends JpaRepository<TestProblemEntity, Long> {
    List<TestProblemEntity> findByTestIdOrderByOrderIndexAsc(Long testId);

    void deleteByTestId(Long testId);
}
