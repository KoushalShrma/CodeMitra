package com.codemitra.backend.controller;

import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.dto.ScraperDtos;
import com.codemitra.backend.service.AuthService;
import com.codemitra.backend.service.scraper.ScraperAdminService;
import com.codemitra.backend.service.scraper.ScraperOrchestratorService;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * SUPER_ADMIN APIs for scraper run controls and manual queue moderation.
 */
@RestController
@RequestMapping("/api/admin/scraper")
public class ScraperAdminController {

    private final AuthService authService;
    private final ScraperOrchestratorService scraperOrchestratorService;
    private final ScraperAdminService scraperAdminService;

    public ScraperAdminController(
            AuthService authService,
            ScraperOrchestratorService scraperOrchestratorService,
            ScraperAdminService scraperAdminService
    ) {
        this.authService = authService;
        this.scraperOrchestratorService = scraperOrchestratorService;
        this.scraperAdminService = scraperAdminService;
    }

    /**
     * Returns queue health, source run health, and Groq cache budget widgets.
     */
    @GetMapping("/stats")
    public Map<String, Object> stats() {
        assertSuperAdmin();
        return scraperAdminService.dashboardStats();
    }

    /**
     * Returns staged scraped problems filtered by import status.
     */
    @GetMapping("/queue")
    public List<Map<String, Object>> queue(
            @RequestParam(name = "status", required = false) String status,
            @RequestParam(name = "limit", defaultValue = "50") int limit
    ) {
        assertSuperAdmin();
        return scraperAdminService.queue(status, limit);
    }

    /**
     * Runs one source immediately, or all active sources when sourceName is omitted.
     */
    @PostMapping("/run")
    public Map<String, Object> run(@RequestBody(required = false) ScraperDtos.RunRequest request) {
        assertSuperAdmin();
        boolean force = request != null && Boolean.TRUE.equals(request.force());
        String sourceName = request == null ? null : request.sourceName();

        if (sourceName == null || sourceName.isBlank()) {
            return scraperOrchestratorService.runAllSources(force);
        }
        return scraperOrchestratorService.runSingleSource(sourceName, force);
    }

    /**
     * Approves and imports one staged problem into canonical problems table.
     */
    @PostMapping("/approve/{scrapedProblemId}")
    public Map<String, Object> approve(@PathVariable("scrapedProblemId") Long scrapedProblemId) {
        Long reviewerId = assertSuperAdmin();
        return scraperAdminService.approve(scrapedProblemId, reviewerId);
    }

    /**
     * Rejects one staged problem row.
     */
    @PostMapping("/reject/{scrapedProblemId}")
    public Map<String, Object> reject(@PathVariable("scrapedProblemId") Long scrapedProblemId) {
        assertSuperAdmin();
        return scraperAdminService.reject(scrapedProblemId);
    }

    /**
     * Toggles a source active flag used by scheduled and manual runs.
     */
    @PostMapping("/sources/{sourceId}/toggle")
    public Map<String, Object> toggleSource(
            @PathVariable("sourceId") Long sourceId,
            @RequestBody ScraperDtos.SourceToggleRequest request
    ) {
        assertSuperAdmin();
        if (request == null || request.active() == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "active is required");
        }
        boolean active = request.active();
        return scraperOrchestratorService.setSourceActive(sourceId, active);
    }

    private Long assertSuperAdmin() {
        String role = RoleMapper.normalize(authService.currentPrincipal().role());
        if (!"SUPER_ADMIN".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "SUPER_ADMIN role required");
        }
        return authService.getOrCreateCurrentUser().getId();
    }
}
