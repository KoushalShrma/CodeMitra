package com.codemitra.dto;

import com.codemitra.model.StageType;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemStageDTO {
    private Long id;
    private StageType stageType;
    private String recommendedApproachText;
    private String expectedTimeComplexity;
    private String expectedSpaceComplexity;
    private Integer minAttemptsBeforeHint;
    private Integer minSecondsBeforeHint;
}
