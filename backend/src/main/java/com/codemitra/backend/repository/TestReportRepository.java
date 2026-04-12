package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestReportEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for finalized report records.
 */
public interface TestReportRepository extends JpaRepository<TestReportEntity, Long> {
    Optional<TestReportEntity> findByAttemptId(Long attemptId);

    List<TestReportEntity> findByTestId(Long testId);
}
