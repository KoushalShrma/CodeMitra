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
 * Stores one canonical accepted submission per user and problem.
 */
@Getter
@Setter
@Entity
@Table(name = "problem_submissions")
public class ProblemSubmissionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "problem_id", nullable = false, length = 120)
    private String problemId;

    @Column(name = "final_code", nullable = false, columnDefinition = "LONGTEXT")
    private String finalCode;

    @Column(name = "total_attempts", nullable = false)
    private Integer totalAttempts = 0;

    @Column(name = "great_moves", nullable = false)
    private Integer greatMoves = 0;

    @Column(nullable = false)
    private Integer mistakes = 0;

    @Column(nullable = false)
    private Integer blunders = 0;

    @Column(name = "total_passed", nullable = false)
    private Integer totalPassed = 0;

    @Column(name = "total_test_cases", nullable = false)
    private Integer totalTestCases = 0;

    @Column(nullable = false, precision = 5, scale = 2)
    private BigDecimal accuracy = BigDecimal.ZERO;

    @Column(name = "total_time_taken_seconds", nullable = false)
    private Integer totalTimeTakenSeconds = 0;

    @Column(name = "total_hints_used", nullable = false)
    private Integer totalHintsUsed = 0;

    @Column(name = "groq_review", columnDefinition = "JSON")
    private String groqReview;

    @Column(name = "chess_rating", length = 30)
    private String chessRating;

    @Column(name = "overall_score", precision = 5, scale = 2)
    private BigDecimal overallScore;

    @Column(nullable = false)
    private Boolean completed = true;

    @CreationTimestamp
    @Column(name = "submitted_at", updatable = false)
    private LocalDateTime submittedAt;
}
