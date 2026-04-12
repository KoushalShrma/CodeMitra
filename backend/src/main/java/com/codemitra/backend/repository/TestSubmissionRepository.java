package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestSubmissionEntity;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for saved answers per attempt/question.
 */
public interface TestSubmissionRepository extends JpaRepository<TestSubmissionEntity, Long> {
    Optional<TestSubmissionEntity> findByAttemptIdAndQuestionId(Long attemptId, Long questionId);

    List<TestSubmissionEntity> findByAttemptId(Long attemptId);

    List<TestSubmissionEntity> findByAttemptIdIn(Collection<Long> attemptIds);
}
