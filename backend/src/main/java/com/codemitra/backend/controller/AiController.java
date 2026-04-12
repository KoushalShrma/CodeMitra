package com.codemitra.backend.controller;

import com.codemitra.backend.dto.AiDtos;
import com.codemitra.backend.service.AiHintService;
import com.codemitra.backend.service.AiStreamingService;
import com.codemitra.backend.service.AuthService;
import com.codemitra.backend.service.GroqCacheGateway;
import com.codemitra.backend.service.GroqService;
import java.util.Map;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * AI proxy controller that keeps Groq API key on the server and exposes safe client endpoint.
 */
@RestController
@RequestMapping("/api/ai")
public class AiController {

    private final GroqCacheGateway groqCacheGateway;
    private final AuthService authService;
    private final AiHintService aiHintService;
    private final AiStreamingService aiStreamingService;

    public AiController(
            GroqCacheGateway groqCacheGateway,
            AuthService authService,
            AiHintService aiHintService,
            AiStreamingService aiStreamingService
    ) {
        this.groqCacheGateway = groqCacheGateway;
        this.authService = authService;
        this.aiHintService = aiHintService;
        this.aiStreamingService = aiStreamingService;
    }

    /**
     * POST /api/ai/chat forwards messages to Groq and returns assistant response payload.
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody GroqService.ChatProxyRequest request) {
        Long userId = authService.getOrCreateCurrentUser().getId();
        GroqService.ChatProxyResult result = groqCacheGateway.chat(request, userId, "chat");
        return ResponseEntity.status(result.status()).body(result.payload());
    }

    /**
     * POST /api/ai/hint enforces backend cooldown and hint budget before generating contextual hints.
     */
    @PostMapping("/hint")
    public ResponseEntity<Map<String, Object>> hint(@RequestBody AiDtos.HintRequest request) {
        AiHintService.AiOperationResult result = aiHintService.requestHint(request);
        return ResponseEntity.status(result.status()).body(result.payload());
    }

    /**
     * POST /api/ai/hint/stream streams hint tokens and final payload over SSE.
     */
    @PostMapping(value = "/hint/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter hintStream(@RequestBody AiDtos.HintRequest request) {
        return aiStreamingService.streamHint(request);
    }

    /**
     * GET /api/ai/hint/status/:problemId returns cooldown and budget status for active session.
     */
    @GetMapping("/hint/status/{problemId}")
    public Map<String, Object> hintStatus(
            @PathVariable("problemId") String problemId,
            @RequestParam(name = "testId", required = false) Long testId
    ) {
        return aiHintService.getHintStatus(problemId, testId);
    }

    /**
     * POST /api/ai/review returns post-acceptance Groq analysis payload.
     */
    @PostMapping("/review")
    public ResponseEntity<Map<String, Object>> review(@RequestBody AiDtos.ReviewRequest request) {
        AiHintService.AiOperationResult result = aiHintService.requestReview(request);
        return ResponseEntity.status(result.status()).body(result.payload());
    }

    /**
     * POST /api/ai/review/stream streams review JSON chunks and final payload over SSE.
     */
    @PostMapping(value = "/review/stream", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public SseEmitter reviewStream(@RequestBody AiDtos.ReviewRequest request) {
        return aiStreamingService.streamReview(request);
    }
}
