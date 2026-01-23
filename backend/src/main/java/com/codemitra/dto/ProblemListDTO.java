package com.codemitra.dto;

import com.codemitra.model.Difficulty;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProblemListDTO {
    private Long id;
    private String title;
    private String slug;
    private Difficulty difficulty;
    private String patternTag;
    private UserProgressSummary progress;
    
    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class UserProgressSummary {
        private boolean bruteCompleted;
        private boolean improvedCompleted;
        private boolean optimalCompleted;
    }
}
