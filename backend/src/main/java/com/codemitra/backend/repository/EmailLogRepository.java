package com.codemitra.backend.repository;

import com.codemitra.backend.model.EmailLogEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for outbound email log entries.
 */
public interface EmailLogRepository extends JpaRepository<EmailLogEntity, Long> {
}