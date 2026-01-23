package com.codemitra.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_stats")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserStats {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;
    
    @Column(name = "problems_solved_count")
    @Builder.Default
    private Integer problemsSolvedCount = 0;
    
    @Column(name = "brute_count")
    @Builder.Default
    private Integer bruteCount = 0;
    
    @Column(name = "improved_count")
    @Builder.Default
    private Integer improvedCount = 0;
    
    @Column(name = "optimal_count")
    @Builder.Default
    private Integer optimalCount = 0;
    
    @Column(name = "current_streak")
    @Builder.Default
    private Integer currentStreak = 0;
    
    @Column(name = "longest_streak")
    @Builder.Default
    private Integer longestStreak = 0;
    
    @Column(name = "last_activity_date")
    private LocalDate lastActivityDate;
    
    @Column(name = "patterns_mastered_json", columnDefinition = "JSON")
    private String patternsMasteredJson;
    
    @Column(name = "badges_json", columnDefinition = "JSON")
    private String badgesJson;
    
    @Column(name = "total_tests_taken")
    @Builder.Default
    private Integer totalTestsTaken = 0;
    
    @Column(name = "average_test_score")
    private BigDecimal averageTestScore;
    
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
