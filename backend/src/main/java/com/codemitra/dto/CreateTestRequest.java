package com.codemitra.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateTestRequest {
    
    @NotBlank(message = "Test name is required")
    private String name;
    
    private String description;
    
    @NotNull(message = "Start time is required")
    private LocalDateTime startTime;
    
    @NotNull(message = "End time is required")
    private LocalDateTime endTime;
    
    @NotNull(message = "Duration is required")
    private Integer durationMinutes;
    
    private List<String> allowedLanguages;
    private Boolean hintsDisabled;
    private List<TestProblemRequest> problems;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestProblemRequest {
        @NotNull(message = "Problem ID is required")
        private Long problemId;
        private Integer maxScore;
        private Integer problemOrder;
    }
}
