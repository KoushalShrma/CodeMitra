package com.codemitra.dto;

import com.codemitra.model.Difficulty;
import com.codemitra.model.StageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateProblemRequest {
    
    @NotBlank(message = "Title is required")
    private String title;
    
    @NotBlank(message = "Description is required")
    private String description;
    
    @NotNull(message = "Difficulty is required")
    private Difficulty difficulty;
    
    @NotBlank(message = "Pattern tag is required")
    private String patternTag;
    
    private String constraintsText;
    private String sampleInput;
    private String sampleOutput;
    private String hiddenTestCases;
    private List<CreateProblemStageRequest> stages;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class CreateProblemStageRequest {
        @NotNull(message = "Stage type is required")
        private StageType stageType;
        private String recommendedApproachText;
        private String expectedTimeComplexity;
        private String expectedSpaceComplexity;
        private Integer minAttemptsBeforeHint;
        private Integer minSecondsBeforeHint;
    }
}
