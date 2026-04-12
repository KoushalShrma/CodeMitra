package com.codemitra.backend.repository;

import com.codemitra.backend.model.InstitutionJoinRequestEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for institution membership join request workflows.
 */
public interface InstitutionJoinRequestRepository extends JpaRepository<InstitutionJoinRequestEntity, Long> {
    Optional<InstitutionJoinRequestEntity> findByInstitutionIdAndUserIdAndStatus(
            Long institutionId,
            Long userId,
            String status
    );

    Optional<InstitutionJoinRequestEntity> findByIdAndInstitutionId(Long id, Long institutionId);

    List<InstitutionJoinRequestEntity> findByInstitutionIdAndStatusOrderByCreatedAtAsc(
            Long institutionId,
            String status
    );

        List<InstitutionJoinRequestEntity> findByInstitutionIdOrderByCreatedAtAsc(Long institutionId);

        void deleteByInstitutionId(Long institutionId);
}
