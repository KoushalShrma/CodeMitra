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
 * Stores each AI hint request for auditability and mentorship history rendering.
 */
@Getter
@Setter
@Entity
@Table(name = "hint_logs")
public class HintLogEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "user_id", nullable = false, columnDefinition = "INT")
    private Long userId;

    @Column(name = "problem_id", nullable = false, length = 120)
    private String problemId;

    @Column(name = "hint_number", nullable = false)
    private Integer hintNumber;

    @CreationTimestamp
    @Column(name = "requested_at", nullable = false, updatable = false)
    private LocalDateTime requestedAt;

    @Column(name = "cooldown_remaining_at_request", nullable = false)
    private Integer cooldownRemainingAtRequest = 0;

    @Column(name = "groq_response", columnDefinition = "TEXT")
    private String groqResponse;
}
