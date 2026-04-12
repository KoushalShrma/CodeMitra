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

/**
 * Stores each judged run of a practice problem.
 */
@Getter
@Setter
@Entity
@Table(name = "practice_runs")
public class PracticeRunEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "problem_id", nullable = false, length = 120)
    private String problemId;

    @Column(nullable = false, length = 30)
    private String language;

    @Column(nullable = false, columnDefinition = "LONGTEXT")
    private String code;

    @Column(nullable = false)
    private Integer passed = 0;

    @Column(nullable = false)
    private Integer total = 0;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "time_taken_seconds", nullable = false)
    private Integer timeTakenSeconds = 0;

    @Column(name = "hints_used", nullable = false)
    private Integer hintsUsed = 0;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
