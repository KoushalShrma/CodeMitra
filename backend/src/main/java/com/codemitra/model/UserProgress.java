package com.codemitra.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_progress")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProgress {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "problem_id", nullable = false)
    private Problem problem;
    
    @Column(name = "brute_completed")
    @Builder.Default
    private Boolean bruteCompleted = false;
    
    @Column(name = "improved_completed")
    @Builder.Default
    private Boolean improvedCompleted = false;
    
    @Column(name = "optimal_completed")
    @Builder.Default
    private Boolean optimalCompleted = false;
    
    @Column(name = "first_attempt_at")
    private LocalDateTime firstAttemptAt;
    
    @Column(name = "brute_completed_at")
    private LocalDateTime bruteCompletedAt;
    
    @Column(name = "improved_completed_at")
    private LocalDateTime improvedCompletedAt;
    
    @Column(name = "optimal_completed_at")
    private LocalDateTime optimalCompletedAt;
    
    @Column(name = "total_attempts")
    @Builder.Default
    private Integer totalAttempts = 0;
    
    @Column(name = "total_hints_used")
    @Builder.Default
    private Integer totalHintsUsed = 0;
    
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
