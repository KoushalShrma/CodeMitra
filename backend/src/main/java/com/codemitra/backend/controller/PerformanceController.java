package com.codemitra.backend.controller;

import com.codemitra.backend.dto.PerformanceDtos;
import com.codemitra.backend.service.PerformanceService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Performance tracking API endpoints.
 */
@RestController
public class PerformanceController {

    private final PerformanceService performanceService;

    public PerformanceController(PerformanceService performanceService) {
        this.performanceService = performanceService;
    }

    /**
     * POST /update-performance upserts score metrics for one user.
     */
    @PostMapping("/update-performance")
    public Map<String, Object> updatePerformance(@RequestBody PerformanceDtos.UpdatePerformanceRequest request) {
        return performanceService.updatePerformance(request);
    }
}
