package com.codemitra.backend.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Health endpoint kept at root path for compatibility with previous backend behavior.
 */
@RestController
public class HealthController {

    @GetMapping("/")
    public String health() {
        return "Server is running";
    }
}
