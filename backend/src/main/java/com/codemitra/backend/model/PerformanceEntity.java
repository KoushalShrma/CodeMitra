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
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Stores cumulative performance metrics for a user.
 */
@Getter
@Setter
@Entity
@Table(name = "performance")
public class PerformanceEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "INT")
    private Long userId;

    @Column(name = "great_moves", nullable = false)
    private Integer greatMoves = 0;

    @Column(nullable = false)
    private Integer mistakes = 0;

    @Column(nullable = false)
    private Integer blunders = 0;

    @Column(nullable = false)
    private Integer streak = 0;

    @Column(nullable = false)
    private Integer score = 0;

    @Column(name = "penalty_points", nullable = false)
    private Integer penaltyPoints = 0;

    @Column(name = "suspicious_attempts", nullable = false)
    private Integer suspiciousAttempts = 0;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
