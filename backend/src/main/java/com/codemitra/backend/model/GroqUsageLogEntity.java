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
 * Fine-grained Groq usage and cost telemetry used for budget guard and analytics.
 */
@Getter
@Setter
@Entity
@Table(name = "groq_usage_log")
public class GroqUsageLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "call_type", nullable = false, length = 20)
    private String callType;

    @Column(name = "tokens_used_input", nullable = false)
    private Integer tokensUsedInput = 0;

    @Column(name = "tokens_used_output", nullable = false)
    private Integer tokensUsedOutput = 0;

    @Column(name = "model_used", nullable = false, length = 120)
    private String modelUsed;

    @Column(name = "cache_hit", nullable = false)
    private Boolean cacheHit = false;

    @Column(name = "cost_estimate_usd", nullable = false, precision = 10, scale = 6)
    private BigDecimal costEstimateUsd = BigDecimal.ZERO;

    @Column(name = "user_id", columnDefinition = "INT")
    private Long userId;

    @Column(name = "problem_id")
    private Long problemId;

    @Column(name = "called_at", nullable = false)
    private LocalDateTime calledAt = LocalDateTime.now();

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
