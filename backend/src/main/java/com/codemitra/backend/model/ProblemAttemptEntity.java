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
 * Stores session-level attempt telemetry for one user/problem pair.
 */
@Getter
@Setter
@Entity
@Table(name = "problem_attempts")
public class ProblemAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "problem_id", nullable = false, length = 120)
    private String problemId;

    @Column(name = "test_id")
    private Long testId;

    @Column(name = "time_to_first_run", nullable = false)
    private Long timeToFirstRun = 0L;

    @Column(name = "time_to_submit", nullable = false)
    private Long timeToSubmit = 0L;

    @Column(name = "total_session_time", nullable = false)
    private Long totalSessionTime = 0L;

    @Column(name = "run_count", nullable = false)
    private Integer runCount = 0;

    @Column(name = "submit_count", nullable = false)
    private Integer submitCount = 0;

    @Column(name = "wrong_submissions", nullable = false)
    private Integer wrongSubmissions = 0;

    @Column(name = "compile_errors", nullable = false)
    private Integer compileErrors = 0;

    @Column(name = "runtime_errors", nullable = false)
    private Integer runtimeErrors = 0;

    @Column(name = "hints_requested", nullable = false)
    private Integer hintsRequested = 0;

    @Column(name = "hint_timestamps", columnDefinition = "JSON")
    private String hintTimestamps;

    @Column(name = "ai_cooldown_violations_attempted", nullable = false)
    private Integer aiCooldownViolationsAttempted = 0;

    @Column(name = "verdict", nullable = false, length = 10)
    private String verdict = "SKIP";

    @Column(name = "language_used", length = 50)
    private String languageUsed;

    @Column(name = "final_code", columnDefinition = "LONGTEXT")
    private String finalCode;

    @Column(name = "final_code_length", nullable = false)
    private Integer finalCodeLength = 0;

    @Column(name = "topic_tags", columnDefinition = "JSON")
    private String topicTags;

    @Column(name = "groq_review", columnDefinition = "JSON")
    private String groqReview;

    @Column(name = "last_hint_timestamp")
    private LocalDateTime lastHintTimestamp;

    @Column(name = "session_started_at", nullable = false)
    private LocalDateTime sessionStartedAt;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
