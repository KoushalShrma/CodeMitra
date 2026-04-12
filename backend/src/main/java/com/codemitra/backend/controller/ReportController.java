package com.codemitra.backend.controller;

import com.codemitra.backend.service.ReportService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Report and analytics controller for student and institute dashboards.
 */
@RestController
public class ReportController {

    private final ReportService reportService;

    public ReportController(ReportService reportService) {
        this.reportService = reportService;
    }

    /**
     * GET /api/report/student/:attemptId returns per-student report payload.
     */
    @GetMapping("/api/report/student/{attemptId}")
    public Map<String, Object> getStudentReport(@PathVariable("attemptId") String attemptId) {
        return reportService.getStudentReport(attemptId);
    }

    /**
     * GET /api/report/test/:testId returns aggregate institute analytics payload.
     */
    @GetMapping("/api/report/test/{testId}")
    public Map<String, Object> getTestAnalytics(@PathVariable("testId") String testId) {
        return reportService.getTestAnalytics(testId);
    }
}
