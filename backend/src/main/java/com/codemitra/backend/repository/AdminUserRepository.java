package com.codemitra.backend.repository;

import com.codemitra.backend.model.AdminUserEntity;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for backend-managed super admin accounts.
 */
public interface AdminUserRepository extends JpaRepository<AdminUserEntity, Long> {
    Optional<AdminUserEntity> findByEmailIgnoreCase(String email);

    Optional<AdminUserEntity> findByUsernameIgnoreCase(String username);

    List<AdminUserEntity> findAllByOrderByCreatedAtAscIdAsc();

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByUsernameIgnoreCase(String username);

    long countByRoleIgnoreCase(String role);
}
