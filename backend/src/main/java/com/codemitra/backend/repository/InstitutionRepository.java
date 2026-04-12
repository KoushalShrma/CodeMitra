package com.codemitra.backend.repository;

import com.codemitra.backend.model.InstitutionEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for institution organizations.
 */
public interface InstitutionRepository extends JpaRepository<InstitutionEntity, Long> {
	Optional<InstitutionEntity> findByCodeIgnoreCase(String code);

	Optional<InstitutionEntity> findByLoginEmailIgnoreCase(String loginEmail);

	boolean existsByCodeIgnoreCase(String code);

	boolean existsByLoginEmailIgnoreCase(String loginEmail);

	List<InstitutionEntity> findByStatusOrderByNameAsc(String status);
}
