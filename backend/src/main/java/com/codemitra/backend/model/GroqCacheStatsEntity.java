package com.codemitra.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Aggregated hit/miss counters for cache performance analytics.
 */
@Getter
@Setter
@Entity
@Table(name = "groq_cache_stats")
public class GroqCacheStatsEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "cache_key", nullable = false, unique = true, length = 255)
    private String cacheKey;

    @Column(name = "hit_count", nullable = false)
    private Long hitCount = 0L;

    @Column(name = "miss_count", nullable = false)
    private Long missCount = 0L;

    @Column(name = "tokens_saved_estimate", nullable = false)
    private Long tokensSavedEstimate = 0L;

    @Column(name = "last_hit_at")
    private LocalDateTime lastHitAt;

    @Column(name = "last_miss_at")
    private LocalDateTime lastMissAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
