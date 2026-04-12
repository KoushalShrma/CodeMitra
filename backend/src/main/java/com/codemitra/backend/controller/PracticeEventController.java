package com.codemitra.backend.controller;

import com.codemitra.backend.dto.PracticeDtos;
import com.codemitra.backend.service.PracticeEventService;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Practice event ingestion API controller.
 */
@RestController
public class PracticeEventController {

    private final PracticeEventService practiceEventService;

    public PracticeEventController(PracticeEventService practiceEventService) {
        this.practiceEventService = practiceEventService;
    }

    /**
     * POST /practice-event logs anti-cheat or behavior event details.
     */
    @PostMapping("/practice-event")
    public Map<String, Object> logPracticeEvent(@RequestBody PracticeDtos.PracticeEventRequest request) {
        return practiceEventService.logPracticeEvent(request);
    }
}
