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
 * Represents a coding test configuration authored by an institute.
 */
@Getter
@Setter
@Entity
@Table(name = "tests")
public class TestEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "institute_id", nullable = false, columnDefinition = "INT")
    private Long instituteId;

    @Column(name = "institution_id")
    private Long institutionId;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private Integer duration;

    @Column(name = "duration_minutes")
    private Integer durationMinutes;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "allow_multiple_attempts", nullable = false)
    private Boolean allowMultipleAttempts = false;

    @Column(name = "anti_cheating_enabled", nullable = false)
    private Boolean antiCheatingEnabled = false;

    @Column(name = "show_results", nullable = false)
    private Boolean showResults = false;

    @Column(name = "allow_ai_hints", nullable = false)
    private Boolean allowAiHints = false;

    @Column(name = "ai_hint_cooldown_minutes", nullable = false)
    private Integer aiHintCooldownMinutes = 10;

    @Column(name = "max_hints_per_problem", nullable = false)
    private Integer maxHintsPerProblem = 3;

    @Column(name = "is_proctored", nullable = false)
    private Boolean isProctored = false;

    @Column(name = "join_code", length = 20)
    private String joinCode;

    @Column(name = "access_scope", nullable = false, length = 40)
    private String accessScope = "INSTITUTION_MEMBERS";

    @Column(name = "published", nullable = false)
    private Boolean published = true;

    @Column(name = "created_by", columnDefinition = "INT")
    private Long createdBy;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
