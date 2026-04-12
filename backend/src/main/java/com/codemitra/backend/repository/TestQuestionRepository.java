package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestQuestionEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for test question records.
 */
public interface TestQuestionRepository extends JpaRepository<TestQuestionEntity, Long> {
    List<TestQuestionEntity> findByTestIdOrderByIdAsc(Long testId);
}
