package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestAttemptEntity;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for student test attempt lifecycles.
 */
public interface TestAttemptRepository extends JpaRepository<TestAttemptEntity, Long> {
    boolean existsByTestIdAndUserIdAndStatusIn(Long testId, Long userId, Collection<String> statuses);

    List<TestAttemptEntity> findByTestId(Long testId);

    List<TestAttemptEntity> findByIdIn(Collection<Long> ids);
}
