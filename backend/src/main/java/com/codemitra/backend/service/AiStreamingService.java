package com.codemitra.backend.service;

import com.codemitra.backend.dto.AiDtos;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

/**
 * Streams AI hint and review payloads over Server-Sent Events for token-by-token UX.
 */
@Service
public class AiStreamingService {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Pattern WORD_WITH_TRAILING_SPACE = Pattern.compile("\\S+\\s*");

    private final AiHintService aiHintService;

    public AiStreamingService(AiHintService aiHintService) {
        this.aiHintService = aiHintService;
    }

    /**
     * Streams one hint response as incremental token events followed by final payload.
     */
    public SseEmitter streamHint(AiDtos.HintRequest request) {
        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                AiHintService.AiOperationResult result = aiHintService.requestHint(request);
                if (!HttpStatus.OK.equals(result.status())) {
                    emitError(emitter, result.status(), result.payload());
                    return;
                }

                String hintText = String.valueOf(result.payload().getOrDefault("hint", "")).trim();
                for (String token : tokenizeWords(hintText)) {
                    emit(emitter, "token", token);
                    sleepQuietly(22L);
                }

                emit(emitter, "final", result.payload());
                emit(emitter, "done", Map.of("ok", true));
                emitter.complete();
            } catch (Exception ex) {
                emitUnexpectedError(emitter, ex);
            }
        });

        return emitter;
    }

    /**
     * Streams one review response as incremental JSON text chunks followed by final payload.
     */
    public SseEmitter streamReview(AiDtos.ReviewRequest request) {
        SseEmitter emitter = new SseEmitter(0L);

        CompletableFuture.runAsync(() -> {
            try {
                AiHintService.AiOperationResult result = aiHintService.requestReview(request);
                if (!HttpStatus.OK.equals(result.status())) {
                    emitError(emitter, result.status(), result.payload());
                    return;
                }

                Object review = result.payload().get("review");
                String reviewJson = writeJson(review, "{}");
                for (String token : chunkBySize(reviewJson, 18)) {
                    emit(emitter, "token", token);
                    sleepQuietly(18L);
                }

                emit(emitter, "final", result.payload());
                emit(emitter, "done", Map.of("ok", true));
                emitter.complete();
            } catch (Exception ex) {
                emitUnexpectedError(emitter, ex);
            }
        });

        return emitter;
    }

    private void emitError(SseEmitter emitter, HttpStatus status, Map<String, Object> payload) {
        Map<String, Object> data = new HashMap<>();
        data.put("status", status.value());
        data.put("message", String.valueOf(payload.getOrDefault("message", "AI request failed")));
        data.put("payload", payload);

        try {
            emit(emitter, "error", data);
            emit(emitter, "done", Map.of("ok", false));
            emitter.complete();
        } catch (Exception ignored) {
            emitter.completeWithError(ignored);
        }
    }

    private void emitUnexpectedError(SseEmitter emitter, Exception ex) {
        Map<String, Object> data = Map.of(
                "status", HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "message", ex.getMessage() == null ? "Streaming failed" : ex.getMessage()
        );

        try {
            emit(emitter, "error", data);
            emit(emitter, "done", Map.of("ok", false));
            emitter.complete();
        } catch (Exception ignored) {
            emitter.completeWithError(ex);
        }
    }

    private void emit(SseEmitter emitter, String eventName, Object data) throws IOException {
        emitter.send(SseEmitter.event().name(eventName).data(data));
    }

    private List<String> tokenizeWords(String text) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        List<String> tokens = new ArrayList<>();
        Matcher matcher = WORD_WITH_TRAILING_SPACE.matcher(text);
        while (matcher.find()) {
            tokens.add(matcher.group());
        }

        if (tokens.isEmpty()) {
            tokens.add(text);
        }
        return tokens;
    }

    private List<String> chunkBySize(String text, int chunkSize) {
        if (text == null || text.isBlank()) {
            return List.of();
        }

        int size = Math.max(chunkSize, 1);
        List<String> tokens = new ArrayList<>();
        for (int index = 0; index < text.length(); index += size) {
            int end = Math.min(index + size, text.length());
            tokens.add(text.substring(index, end));
        }
        return tokens;
    }

    private String writeJson(Object value, String fallback) {
        try {
            return OBJECT_MAPPER.writeValueAsString(value);
        } catch (Exception ex) {
            return fallback;
        }
    }

    private void sleepQuietly(long millis) {
        try {
            Thread.sleep(Math.max(0L, millis));
        } catch (InterruptedException ignored) {
            Thread.currentThread().interrupt();
        }
    }
}
