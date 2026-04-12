package com.codemitra.backend.repository;

import com.codemitra.backend.model.UserAnalyticsEntity;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 * Repository for computed user analytics snapshots.
 */
public interface UserAnalyticsRepository extends JpaRepository<UserAnalyticsEntity, Long> {
}
