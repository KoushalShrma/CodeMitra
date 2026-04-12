package com.codemitra.backend.repository;

import com.codemitra.backend.model.InstitutionRequestEntity;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for institution onboarding request lifecycle.
 */
public interface InstitutionRequestRepository extends JpaRepository<InstitutionRequestEntity, Long> {
    List<InstitutionRequestEntity> findByStatusOrderByCreatedAtAsc(String status);

    List<InstitutionRequestEntity> findAllByOrderByCreatedAtDesc();

    boolean existsByOfficialEmailIgnoreCaseAndStatus(String officialEmail, String status);
}
