package com.codemitra.backend.controller;

import com.codemitra.backend.dto.TestDtos;
import com.codemitra.backend.service.TestService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Institute-facing test management controller.
 */
@RestController
public class TestController {

    private final TestService testService;

    public TestController(TestService testService) {
        this.testService = testService;
    }

    /**
     * POST /api/tests/create creates a full test definition.
     */
    @PostMapping("/api/tests/create")
    public Map<String, Object> createTest(@RequestBody TestDtos.CreateTestRequest request) {
        return testService.createTest(request);
    }

    /**
     * GET /api/tests/institute/:instituteId lists institute tests.
     */
    @GetMapping("/api/tests/institute/{instituteId}")
    public Map<String, Object> getTestsByInstitute(@PathVariable("instituteId") String instituteId) {
        return testService.getTestsByInstitute(instituteId);
    }

    /**
     * GET /api/tests/details/:testId returns one full test payload.
     */
    @GetMapping("/api/tests/details/{testId}")
    public Map<String, Object> getTestDetails(@PathVariable("testId") String testId) {
        return testService.getTestDetails(testId);
    }
}
