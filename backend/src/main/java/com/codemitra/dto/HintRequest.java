package com.codemitra.dto;

import com.codemitra.model.StageType;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HintRequest {
    
    @NotNull(message = "Problem ID is required")
    private Long problemId;
    
    @NotNull(message = "Stage type is required")
    private StageType stageType;
    
    private String userCode;
    private String errorMessage;
}
