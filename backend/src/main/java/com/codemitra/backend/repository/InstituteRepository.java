package com.codemitra.backend.repository;

import com.codemitra.backend.model.InstituteEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for institute registration and lookup operations.
 */
public interface InstituteRepository extends JpaRepository<InstituteEntity, Long> {
    Optional<InstituteEntity> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByInstituteCode(String instituteCode);
}
