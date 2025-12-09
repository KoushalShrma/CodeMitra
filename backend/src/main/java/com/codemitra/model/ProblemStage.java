package com.codemitra.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "problem_stages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemStage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "stage_type", nullable = false)
    private StageType stageType;
    
    @Column(name = "recommended_approach_text", columnDefinition = "TEXT")
    private String recommendedApproachText;
    
    @Column(name = "expected_time_complexity")
    private String expectedTimeComplexity;
    
    @Column(name = "expected_space_complexity")
    private String expectedSpaceComplexity;
    
    @Column(name = "min_attempts_before_hint")
    @Builder.Default
    private Integer minAttemptsBeforeHint = 2;
    
    @Column(name = "min_seconds_before_hint")
    @Builder.Default
    private Integer minSecondsBeforeHint = 90;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
