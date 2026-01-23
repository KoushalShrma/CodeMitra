package com.codemitra.dto;

import com.codemitra.model.StageType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunCodeRequest {
    
    @NotNull(message = "Problem ID is required")
    private Long problemId;
    
    @NotNull(message = "Stage type is required")
    private StageType stageType;
    
    @NotBlank(message = "Language is required")
    private String language;
    
    @NotBlank(message = "Code is required")
    private String code;
    
    private Long testId;
    
    /**
     * SAMPLE - run against sample test case only
     * FULL - run against all hidden test cases
     */
    private String mode = "SAMPLE";
}
