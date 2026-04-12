package com.codemitra.backend.controller;

import com.codemitra.backend.dto.ExecutionDtos;
import com.codemitra.backend.service.CodeExecutionService;
import java.util.Map;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Judge0 execution controller mounted at /api/execution to preserve previous route structure.
 */
@RestController
@RequestMapping("/api")
public class ExecutionController {

    private final CodeExecutionService codeExecutionService;

    public ExecutionController(CodeExecutionService codeExecutionService) {
        this.codeExecutionService = codeExecutionService;
    }

    /**
     * GET /api/execution/provider returns chosen Judge0 endpoint mode.
     */
    @GetMapping("/execution/provider")
    public Map<String, Object> getProvider() {
        return codeExecutionService.getProvider();
    }

    /**
     * POST /api/execute submits and polls Judge0 for execution results.
     */
    @PostMapping("/execute")
    public ResponseEntity<Map<String, Object>> execute(@RequestBody ExecutionDtos.ExecuteRequest request) {
        CodeExecutionService.ExecutionResult result = codeExecutionService.execute(request);
        return ResponseEntity.status(result.status()).body(result.payload());
    }

    /**
     * POST /api/execution/execute kept as compatibility alias for existing frontend integrations.
     */
    @PostMapping("/execution/execute")
    public ResponseEntity<Map<String, Object>> executeLegacy(@RequestBody ExecutionDtos.ExecuteRequest request) {
        CodeExecutionService.ExecutionResult result = codeExecutionService.execute(request);
        return ResponseEntity.status(result.status()).body(result.payload());
    }
}
