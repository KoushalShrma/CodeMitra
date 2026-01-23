package com.codemitra.dto;

import com.codemitra.model.StageType;
import com.codemitra.model.SubmissionStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubmissionDTO {
    private Long id;
    private Long userId;
    private Long problemId;
    private Long testId;
    private StageType stageType;
    private String language;
    private String code;
    private SubmissionStatus status;
    private Long runtimeMs;
    private Long memoryKb;
    private String stdout;
    private String stderr;
    private List<TestResult> testResults;
    private LocalDateTime createdAt;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestResult {
        private int testCaseNumber;
        private boolean passed;
        private String input;
        private String expectedOutput;
        private String actualOutput;
        private String message;
    }
}
