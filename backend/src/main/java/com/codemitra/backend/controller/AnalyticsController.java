package com.codemitra.backend.controller;

import com.codemitra.backend.dto.AnalyticsDtos;
import com.codemitra.backend.service.AnalyticsEngineService;
import com.codemitra.backend.service.AuthService;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

/**
 * Provides analytics APIs consumed by learner dashboards and institution insights.
 */
@RestController
@RequestMapping("/api/analytics")
public class AnalyticsController {

    private final AnalyticsEngineService analyticsEngineService;
    private final AuthService authService;

    public AnalyticsController(AnalyticsEngineService analyticsEngineService, AuthService authService) {
        this.analyticsEngineService = analyticsEngineService;
        this.authService = authService;
    }

    /**
     * Returns full analytics payload for the authenticated user.
     */
    @GetMapping("/me")
    public Map<String, Object> getMyAnalytics() {
        Long userId = authService.getOrCreateCurrentUser().getId();
        return analyticsEngineService.getAnalyticsPayload(userId);
    }

    /**
     * Returns one topic-focused analytics breakdown for the authenticated user.
     */
    @GetMapping("/me/topic/{tag}")
    public Map<String, Object> getTopicBreakdown(@PathVariable("tag") String tag) {
        Long userId = authService.getOrCreateCurrentUser().getId();
        return analyticsEngineService.getTopicPayload(userId, tag);
    }

    /**
     * Triggers analytics recomputation for current user, or for target user when caller has elevated role.
     */
    @PostMapping("/recalculate")
    public Map<String, Object> recalculate(@RequestBody(required = false) AnalyticsDtos.RecalculateRequest request) {
        Long currentUserId = authService.getOrCreateCurrentUser().getId();
        Long targetUserId = currentUserId;

        if (request != null && request.userId() != null && !request.userId().equals(currentUserId)) {
            String role = authService.currentPrincipal().role();
            boolean elevated = role != null && (
                    role.equalsIgnoreCase("SUPER_ADMIN")
                            || role.equalsIgnoreCase("INSTITUTION_ADMIN")
                            || role.equalsIgnoreCase("INSTRUCTOR")
            );
            if (!elevated) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
            }
            targetUserId = request.userId();
        }

        analyticsEngineService.recalculateSync(targetUserId);
        return Map.of(
                "message", "Analytics recalculated",
                "userId", targetUserId
        );
    }
}
