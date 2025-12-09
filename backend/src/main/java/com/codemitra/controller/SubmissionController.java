package com.codemitra.controller;

import com.codemitra.dto.*;
import com.codemitra.model.User;
import com.codemitra.service.CodeExecutionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/submissions")
@RequiredArgsConstructor
public class SubmissionController {
    
    private final CodeExecutionService codeExecutionService;
    
    @PostMapping("/run")
    public ResponseEntity<ApiResponse<RunCodeResponse>> runCode(
            @Valid @RequestBody RunCodeRequest request,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        
        try {
            RunCodeResponse response = codeExecutionService.runCode(request, user);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Code execution failed: " + e.getMessage()));
        }
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<RunCodeResponse>> submitCode(
            @Valid @RequestBody RunCodeRequest request,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        
        // For full submission, run against all test cases
        request.setMode("FULL");
        
        try {
            RunCodeResponse response = codeExecutionService.runCode(request, user);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Submission failed: " + e.getMessage()));
        }
    }
}
