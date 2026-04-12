package com.codemitra.backend.repository;

import com.codemitra.backend.model.CustomProblemEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for institution-authored custom problem bank records.
 */
public interface CustomProblemRepository extends JpaRepository<CustomProblemEntity, Long> {
    List<CustomProblemEntity> findByInstitutionIdOrderByUpdatedAtDescIdDesc(Long institutionId);
}
