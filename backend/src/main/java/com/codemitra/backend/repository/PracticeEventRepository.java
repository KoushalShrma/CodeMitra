package com.codemitra.backend.repository;

import com.codemitra.backend.model.PracticeEventEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for persisted practice events.
 */
public interface PracticeEventRepository extends JpaRepository<PracticeEventEntity, Long> {
}
