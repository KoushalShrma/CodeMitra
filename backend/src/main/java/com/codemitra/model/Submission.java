package com.codemitra.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "submissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Submission {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "test_id")
    private Test test;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "stage_type", nullable = false)
    private StageType stageType;
    
    @Column(nullable = false)
    private String language;
    
    @Column(columnDefinition = "TEXT", nullable = false)
    private String code;
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SubmissionStatus status;
    
    @Column(name = "runtime_ms")
    private Long runtimeMs;
    
    @Column(name = "memory_kb")
    private Long memoryKb;
    
    @Column(name = "test_result_json", columnDefinition = "JSON")
    private String testResultJson;
    
    @Column(columnDefinition = "TEXT")
    private String stdout;
    
    @Column(columnDefinition = "TEXT")
    private String stderr;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
