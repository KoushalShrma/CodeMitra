package com.codemitra.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentDashboardDTO {
    private Long userId;
    private String userName;
    
    // Overall stats
    private Integer problemsSolved;
    private Integer bruteCount;
    private Integer improvedCount;
    private Integer optimalCount;
    
    // Streaks
    private Integer currentStreak;
    private Integer longestStreak;
    
    // Pattern progress
    private Map<String, PatternProgress> patternProgress;
    
    // Recent activity
    private List<RecentSubmission> recentSubmissions;
    
    // Badges
    private List<BadgeDTO> badges;
    
    // Test performance
    private Integer totalTestsTaken;
    private Double averageTestScore;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatternProgress {
        private String patternTag;
        private Integer solved;
        private Integer total;
        private Double percentage;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class RecentSubmission {
        private Long problemId;
        private String problemTitle;
        private String stageType;
        private String status;
        private String language;
        private String createdAt;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class BadgeDTO {
        private String name;
        private String description;
        private String iconUrl;
        private String earnedAt;
    }
}
