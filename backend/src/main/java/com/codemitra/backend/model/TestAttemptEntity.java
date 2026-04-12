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
 * Represents one student's timed attempt for a test.
 */
@Getter
@Setter
@Entity
@Table(name = "test_attempts")
public class TestAttemptEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "test_id", nullable = false, columnDefinition = "INT")
    private Long testId;

    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "start_time", nullable = false)
    private LocalDateTime startTime;

    @Column(name = "end_time", nullable = false)
    private LocalDateTime endTime;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(nullable = false, length = 20)
    private String status = "ongoing";

    @Column(name = "tab_switch_count", nullable = false)
    private Integer tabSwitchCount = 0;

    @Column(name = "anti_cheat_flags", nullable = false)
    private Integer antiCheatFlags = 0;

    @Column(name = "total_score", nullable = false)
    private Integer totalScore = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
