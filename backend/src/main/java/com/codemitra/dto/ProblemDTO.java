package com.codemitra.dto;

import com.codemitra.model.Difficulty;
import com.codemitra.model.StageType;
import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemDTO {
    private Long id;
    private String title;
    private String slug;
    private String description;
    private Difficulty difficulty;
    private String patternTag;
    private String constraintsText;
    private String sampleInput;
    private String sampleOutput;
    private List<ProblemStageDTO> stages;
    private LocalDateTime createdAt;
}
