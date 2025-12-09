package com.codemitra.controller;

import com.codemitra.dto.ApiResponse;
import com.codemitra.service.ProblemService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patterns")
@RequiredArgsConstructor
public class PatternController {
    
    private final ProblemService problemService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<List<String>>> getAllPatterns() {
        List<String> patterns = problemService.getAllPatternTags();
        return ResponseEntity.ok(ApiResponse.success(patterns));
    }
}
