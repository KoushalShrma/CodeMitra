package com.codemitra.dto;

import lombok.*;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstructorDashboardDTO {
    private Long userId;
    private String userName;
    
    // Overview stats
    private Integer totalStudents;
    private Integer activeStudents;
    private Integer totalTests;
    private Integer activeTests;
    
    // Test performance
    private List<TestSummary> recentTests;
    
    // Pattern analysis
    private Map<String, PatternAnalysis> patternAnalysis;
    
    // Top performers
    private List<StudentSummary> topPerformers;
    
    // Students needing help
    private List<StudentSummary> studentsNeedingHelp;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestSummary {
        private Long testId;
        private String testName;
        private String status;
        private Integer participantCount;
        private Double averageScore;
        private String startTime;
        private String endTime;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class PatternAnalysis {
        private String patternTag;
        private Integer totalAttempts;
        private Double successRate;
        private Double averageAttempts;
    }
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class StudentSummary {
        private Long userId;
        private String name;
        private String email;
        private Integer problemsSolved;
        private Double averageTestScore;
        private String weakestPattern;
    }
}
