package com.codemitra.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

/**
 * Stores finalized computed test analytics for one student attempt.
 */
@Getter
@Setter
@Entity
@Table(name = "test_reports")
public class TestReportEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "attempt_id", nullable = false, unique = true, columnDefinition = "INT")
    private Long attemptId;

    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "test_id", nullable = false, columnDefinition = "INT")
    private Long testId;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracy = BigDecimal.ZERO;

    @Column(nullable = false)
    private Integer score = 0;

    @Column(name = "great_moves", nullable = false)
    private Integer greatMoves = 0;

    @Column(nullable = false)
    private Integer mistakes = 0;

    @Column(nullable = false)
    private Integer blunders = 0;

    @Column(name = "time_taken", nullable = false)
    private Integer timeTaken = 0;

    @CreationTimestamp
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
