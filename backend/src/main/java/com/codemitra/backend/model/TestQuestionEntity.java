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
 * Represents one question linked to a test.
 */
@Getter
@Setter
@Entity
@Table(name = "test_questions")
public class TestQuestionEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "test_id", nullable = false, columnDefinition = "INT")
    private Long testId;

    @Column(name = "problem_id", length = 120)
    private String problemId;

    @Column(name = "custom_question", columnDefinition = "TEXT")
    private String customQuestion;

    @Column(nullable = false, length = 40)
    private String difficulty;

    @Column(nullable = false, length = 100)
    private String topic;

    @Column(nullable = false, length = 100)
    private String pattern;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
