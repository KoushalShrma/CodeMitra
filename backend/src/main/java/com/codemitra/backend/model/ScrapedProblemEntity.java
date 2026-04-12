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
 * Staging record for raw scraped problems awaiting admin review and approval.
 */
@Getter
@Setter
@Entity
@Table(name = "scraped_problems")
public class ScrapedProblemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "source_id", nullable = false)
    private Long sourceId;

    @Column(name = "external_id", length = 255)
    private String externalId;

    @Column(name = "title", nullable = false, length = 255)
    private String title;

    @Column(name = "description", columnDefinition = "LONGTEXT")
    private String description;

    @Column(name = "difficulty_raw", length = 120)
    private String difficultyRaw;

    @Column(name = "difficulty_normalized", nullable = false, length = 10)
    private String difficultyNormalized = "Medium";

    @Column(name = "topic_tags", columnDefinition = "JSON")
    private String topicTags;

    @Column(name = "time_limit_ms")
    private Integer timeLimitMs;

    @Column(name = "memory_limit_mb")
    private Integer memoryLimitMb;

    @Column(name = "where_asked", length = 500)
    private String whereAsked;

    @Column(name = "source_url", length = 500)
    private String sourceUrl;

    @Column(name = "content_hash", nullable = false, length = 64)
    private String contentHash;

    @Column(name = "import_status", nullable = false, length = 12)
    private String importStatus = "PENDING";

    @Column(name = "scraped_at", nullable = false)
    private LocalDateTime scrapedAt = LocalDateTime.now();

    @Column(name = "imported_at")
    private LocalDateTime importedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
