package com.codemitra.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TestDTO {
    private Long id;
    private String name;
    private String description;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer durationMinutes;
    private List<String> allowedLanguages;
    private Boolean hintsDisabled;
    private Boolean isActive;
    private Long createdById;
    private String createdByName;
    private List<TestProblemDTO> problems;
    private LocalDateTime createdAt;
    
    // Participant-specific fields
    private String participantStatus;
    private Integer participantScore;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestProblemDTO {
        private Long id;
        private Long problemId;
        private String problemTitle;
        private String problemDifficulty;
        private Integer maxScore;
        private Integer problemOrder;
    }
}
