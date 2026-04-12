package com.codemitra.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot entry point for the Code_Mitra backend.
 * This application fully replaces the former Node.js/Express server.
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class CodeMitraBackendApplication {

    public static void main(String[] args) {
        SpringApplication.run(CodeMitraBackendApplication.class, args);
    }
}
