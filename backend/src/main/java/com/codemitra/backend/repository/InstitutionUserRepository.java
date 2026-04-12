package com.codemitra.backend.repository;

import com.codemitra.backend.model.InstitutionUserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for institution membership and role mapping rows.
 */
public interface InstitutionUserRepository extends JpaRepository<InstitutionUserEntity, Long> {
    Optional<InstitutionUserEntity> findByUserIdAndInstitutionId(Long userId, Long institutionId);

    Optional<InstitutionUserEntity> findByIdAndInstitutionId(Long id, Long institutionId);

    List<InstitutionUserEntity> findByInstitutionId(Long institutionId);

    List<InstitutionUserEntity> findByUserId(Long userId);

    void deleteByInstitutionId(Long institutionId);
}
