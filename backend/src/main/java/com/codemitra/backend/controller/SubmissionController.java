package com.codemitra.backend.controller;

import com.codemitra.backend.dto.PracticeDtos;
import com.codemitra.backend.service.SubmissionService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Practice submission and run-history API endpoints.
 */
@RestController
public class SubmissionController {

    private final SubmissionService submissionService;

    public SubmissionController(SubmissionService submissionService) {
        this.submissionService = submissionService;
    }

    /**
     * POST /runs stores one practice run result.
     */
    @PostMapping("/runs")
    public Map<String, Object> trackRun(@RequestBody PracticeDtos.TrackRunRequest request) {
        return submissionService.trackRun(request);
    }

    /**
     * GET /runs/:userId/:problemId returns chronological run history.
     */
    @GetMapping("/runs/{userId}/{problemId}")
    public Map<String, Object> getRunHistory(
            @PathVariable("userId") String userId,
            @PathVariable("problemId") String problemId
    ) {
        return submissionService.getRunHistory(userId, problemId);
    }

    /**
     * POST /submit finalizes a fully passing solution.
     */
    @PostMapping("/submit")
    public Map<String, Object> submitSolution(@RequestBody PracticeDtos.SubmitSolutionRequest request) {
        return submissionService.submitSolution(request);
    }
}
