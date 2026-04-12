package com.codemitra.backend.controller;

import com.codemitra.backend.dto.TestDtos;
import com.codemitra.backend.service.StudentTestService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Student test lifecycle controller.
 */
@RestController
public class StudentTestController {

    private final StudentTestService studentTestService;

    public StudentTestController(StudentTestService studentTestService) {
        this.studentTestService = studentTestService;
    }

    /**
     * GET /api/student-tests/active returns active tests for students.
     */
    @GetMapping("/api/student-tests/active")
    public Map<String, Object> getActiveTests() {
        return studentTestService.getActiveTests();
    }

    /**
     * POST /api/student-tests/start creates a test attempt.
     */
    @PostMapping("/api/student-tests/start")
    public Map<String, Object> startTestAttempt(@RequestBody TestDtos.StartAttemptRequest request) {
        return studentTestService.startTestAttempt(request);
    }

    /**
     * POST /api/student-tests/join-by-code creates an attempt using unique test join code.
     */
    @PostMapping("/api/student-tests/join-by-code")
    public Map<String, Object> joinByCode(@RequestBody TestDtos.JoinByCodeRequest request) {
        return studentTestService.startTestAttemptByCode(request);
    }

    /**
     * GET /api/student-tests/attempt/:attemptId returns question payload and saved answers.
     */
    @GetMapping("/api/student-tests/attempt/{attemptId}")
    public Map<String, Object> getAttemptDetails(@PathVariable("attemptId") String attemptId) {
        return studentTestService.getAttemptDetails(attemptId);
    }

    /**
     * POST /api/student-tests/submissions/save upserts one answer.
     */
    @PostMapping("/api/student-tests/submissions/save")
    public Map<String, Object> saveTestSubmission(@RequestBody TestDtos.SaveSubmissionRequest request) {
        return studentTestService.saveTestSubmission(request);
    }

    /**
     * POST /api/student-tests/submit finalizes attempt and computes report.
     */
    @PostMapping("/api/student-tests/submit")
    public Map<String, Object> submitTestAttempt(@RequestBody TestDtos.SubmitAttemptRequest request) {
        return studentTestService.submitTestAttempt(request);
    }

    /**
     * POST /api/student-tests/anti-cheat tracks anti-cheat flags.
     */
    @PostMapping("/api/student-tests/anti-cheat")
    public Map<String, Object> trackAntiCheat(@RequestBody TestDtos.AntiCheatRequest request) {
        return studentTestService.trackAntiCheat(request);
    }
}
