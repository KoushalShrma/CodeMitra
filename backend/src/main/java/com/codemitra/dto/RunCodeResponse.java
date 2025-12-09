package com.codemitra.dto;

import com.codemitra.model.SubmissionStatus;
import lombok.*;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RunCodeResponse {
    private SubmissionStatus status;
    private String stdout;
    private String stderr;
    private Long runtimeMs;
    private Long memoryKb;
    private List<SubmissionDTO.TestResult> testResults;
    private Long submissionId;
    private boolean stageCompleted;
}
