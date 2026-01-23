package com.codemitra.controller;

import com.codemitra.dto.ApiResponse;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {
    
    @GetMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> health() {
        Map<String, String> health = Map.of(
                "status", "UP",
                "service", "CodeMitra Backend",
                "version", "1.0.0"
        );
        return ResponseEntity.ok(ApiResponse.success(health));
    }
}
