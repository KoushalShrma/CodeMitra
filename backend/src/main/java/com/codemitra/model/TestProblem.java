package com.codemitra.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "test_problems")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestProblem {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id", nullable = false)
    private Test test;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;
    
    @Column(name = "max_score")
    @Builder.Default
    private Integer maxScore = 100;
    
    @Column(name = "problem_order")
    @Builder.Default
    private Integer problemOrder = 0;
}
