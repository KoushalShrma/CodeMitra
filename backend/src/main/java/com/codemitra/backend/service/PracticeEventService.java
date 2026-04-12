package com.codemitra.backend.service;

import com.codemitra.backend.dto.PracticeDtos;
import com.codemitra.backend.model.PracticeEventEntity;
import com.codemitra.backend.repository.PracticeEventRepository;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Persists practice event timeline records.
 */
@Service
public class PracticeEventService {

    private final PracticeEventRepository practiceEventRepository;
    private final AuthService authService;

    public PracticeEventService(PracticeEventRepository practiceEventRepository, AuthService authService) {
        this.practiceEventRepository = practiceEventRepository;
        this.authService = authService;
    }

    /**
     * Saves a practice event, defaulting to authenticated user when user_id is omitted.
     */
    @Transactional
    public Map<String, Object> logPracticeEvent(PracticeDtos.PracticeEventRequest request) {
        if (request.event_type() == null || request.event_type().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "user_id and event_type are required");
        }

        Long userId = request.user_id() == null
                ? authService.getOrCreateCurrentUser().getId()
                : authService.resolveUserId(String.valueOf(request.user_id()));

        PracticeEventEntity entity = new PracticeEventEntity();
        entity.setUserId(userId);
        entity.setEventType(request.event_type());
        entity.setDetails(request.details() == null || request.details().isBlank() ? null : request.details());
        practiceEventRepository.save(entity);

        return Map.of("message", "Practice event logged");
    }
}
