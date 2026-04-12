package com.codemitra.backend.repository;

import com.codemitra.backend.model.ProctoringEventEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for persisted proctoring telemetry events.
 */
public interface ProctoringEventRepository extends JpaRepository<ProctoringEventEntity, Long> {
    List<ProctoringEventEntity> findByAttemptIdOrderByOccurredAtAsc(Long attemptId);

    List<ProctoringEventEntity> findByTestIdAndEventTypeIgnoreCaseOrderByOccurredAtDesc(Long testId, String eventType);
}
