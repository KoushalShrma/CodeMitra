package com.codemitra.controller;

import com.codemitra.dto.*;
import com.codemitra.model.Difficulty;
import com.codemitra.model.User;
import com.codemitra.service.ProblemService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/problems")
@RequiredArgsConstructor
public class ProblemController {
    
    private final ProblemService problemService;
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<ProblemListDTO>>> getProblems(
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String pattern,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt") String sortBy,
            @RequestParam(defaultValue = "desc") String sortDir,
            @AuthenticationPrincipal User user) {
        
        Difficulty difficultyEnum = null;
        if (difficulty != null && !difficulty.isEmpty()) {
            try {
                difficultyEnum = Difficulty.valueOf(difficulty.toUpperCase());
            } catch (IllegalArgumentException ignored) {}
        }
        
        Sort sort = sortDir.equalsIgnoreCase("asc") 
                ? Sort.by(sortBy).ascending() 
                : Sort.by(sortBy).descending();
        
        PageRequest pageRequest = PageRequest.of(page, size, sort);
        Long userId = user != null ? user.getId() : null;
        
        Page<ProblemListDTO> problems = problemService.getProblems(
                difficultyEnum, pattern, search, userId, pageRequest);
        
        return ResponseEntity.ok(ApiResponse.success(problems));
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProblemDTO>> getProblemById(@PathVariable Long id) {
        return problemService.getProblemById(id)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/slug/{slug}")
    public ResponseEntity<ApiResponse<ProblemDTO>> getProblemBySlug(@PathVariable String slug) {
        return problemService.getProblemBySlug(slug)
                .map(dto -> ResponseEntity.ok(ApiResponse.success(dto)))
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public ResponseEntity<ApiResponse<ProblemDTO>> createProblem(
            @Valid @RequestBody CreateProblemRequest request,
            @AuthenticationPrincipal User user) {
        
        if (user == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }
        
        // Only instructors and admins can create problems
        if (user.getRole().name().equals("STUDENT")) {
            return ResponseEntity.status(403).body(ApiResponse.error("Not authorized to create problems"));
        }
        
        ProblemDTO problem = problemService.createProblem(request, user);
        return ResponseEntity.ok(ApiResponse.success("Problem created successfully", problem));
    }
}
