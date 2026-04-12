package com.codemitra.backend.repository;

import com.codemitra.backend.model.UserEntity;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for user identity/profile records.
 */
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    Optional<UserEntity> findByEmailIgnoreCase(String email);

    Optional<UserEntity> findByClerkId(String clerkId);

    boolean existsByEmailIgnoreCase(String email);
}
