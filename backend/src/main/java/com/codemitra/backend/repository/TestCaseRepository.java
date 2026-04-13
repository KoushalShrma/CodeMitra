package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestCaseEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for test case input/output rows.
 */
public interface TestCaseRepository extends JpaRepository<TestCaseEntity, Long> {
    List<TestCaseEntity> findByQuestionIdInOrderByIdAsc(Collection<Long> questionIds);

    void deleteByQuestionIdIn(Collection<Long> questionIds);
}
