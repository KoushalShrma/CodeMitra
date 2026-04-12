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
 * Stores ordered problem assignment and marks for each test.
 */
@Getter
@Setter
@Entity
@Table(name = "test_problems")
public class TestProblemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false)
    private Long id;

    @Column(name = "test_id", nullable = false, columnDefinition = "INT")
    private Long testId;

    @Column(name = "problem_id", nullable = false, length = 120)
    private String problemId;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "marks", nullable = false)
    private Integer marks = 100;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
}
