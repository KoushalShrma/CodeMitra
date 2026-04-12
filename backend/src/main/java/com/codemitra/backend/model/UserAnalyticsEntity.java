package com.codemitra.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Stores computed user analytics scores that power ranking and progress dashboards.
 */
@Getter
@Setter
@Entity
@Table(name = "user_analytics")
public class UserAnalyticsEntity {

    @Id
    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "topic_scores", nullable = false, columnDefinition = "JSON")
    private String topicScores = "{}";

    @Column(name = "consistency_score", nullable = false)
    private Double consistencyScore = 0.0;

    @Column(name = "independence_score", nullable = false)
    private Double independenceScore = 100.0;

    @Column(name = "speed_percentile", nullable = false)
    private Double speedPercentile = 0.0;

    @Column(name = "code_quality_rating", nullable = false)
    private Double codeQualityRating = 0.0;

    @Column(name = "overall_rank_score", nullable = false)
    private Double overallRankScore = 0.0;

    @Column(name = "total_solved", nullable = false)
    private Integer totalSolved = 0;

    @Column(name = "total_attempts", nullable = false)
    private Integer totalAttempts = 0;

    @Column(name = "total_hints_used", nullable = false)
    private Integer totalHintsUsed = 0;

    @Column(name = "streak_days", nullable = false)
    private Integer streakDays = 0;

    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;

    @Column(name = "stale", nullable = false)
    private Boolean stale = false;

    @Column(name = "stale_since")
    private LocalDateTime staleSince;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
