package com.codemitra.controller;

import com.codemitra.dto.*;
import com.codemitra.model.User;
import com.codemitra.service.HintService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/hints")
@RequiredArgsConstructor
public class HintController {
    
    private final HintService hintService;
    
    @PostMapping("/request")
    public ResponseEntity<ApiResponse<HintResponse>> requestHint(
            @Valid @RequestBody HintRequest request,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        
        try {
            HintResponse response = hintService.requestHint(request, user);
            return ResponseEntity.ok(ApiResponse.success(response));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error(e.getMessage()));
        }
    }
}
