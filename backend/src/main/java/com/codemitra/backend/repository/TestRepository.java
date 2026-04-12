package com.codemitra.backend.repository;

import com.codemitra.backend.model.TestEntity;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for coding test definitions.
 */
public interface TestRepository extends JpaRepository<TestEntity, Long> {
    List<TestEntity> findByInstituteIdOrderByCreatedAtDescIdDesc(Long instituteId);

    List<TestEntity> findByInstitutionIdOrderByCreatedAtDescIdDesc(Long institutionId);

    List<TestEntity> findByStartTimeLessThanEqualAndEndTimeGreaterThanEqualOrderByStartTimeAscIdAsc(
            LocalDateTime nowStart,
            LocalDateTime nowEnd
    );

    List<TestEntity> findByStartTimeLessThanEqualAndEndTimeGreaterThanEqualAndPublishedTrueOrderByStartTimeAscIdAsc(
            LocalDateTime nowStart,
            LocalDateTime nowEnd
    );

    List<TestEntity> findByEndTimeGreaterThanEqualAndPublishedTrueOrderByStartTimeAscIdAsc(LocalDateTime now);

    Optional<TestEntity> findByJoinCodeIgnoreCase(String joinCode);

    boolean existsByJoinCodeIgnoreCase(String joinCode);
}
