package com.codemitra.backend.controller;

import com.codemitra.backend.dto.AuthDtos;
import com.codemitra.backend.service.AuthService;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/**
 * Exposes legacy auth-compatible endpoints and Clerk user sync endpoint.
 */
@RestController
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /signup compatibility endpoint.
     */
    @PostMapping("/signup")
    public Map<String, Object> signup(@Valid @RequestBody AuthDtos.SignupRequest request) {
        return authService.signup(request);
    }

    /**
     * POST /api/institute/register compatibility endpoint.
     */
    @PostMapping("/api/institute/register")
    public Map<String, Object> registerInstitute(@Valid @RequestBody AuthDtos.InstituteRegisterRequest request) {
        return authService.registerInstitute(request);
    }

    /**
     * POST /login compatibility endpoint.
     */
    @PostMapping("/login")
    public Map<String, Object> login(@Valid @RequestBody AuthDtos.LoginRequest request) {
        return authService.login(request);
    }

    /**
     * Extra endpoint used by Clerk frontend integration to sync local DB user row.
     */
    @PostMapping("/api/auth/sync")
    public Map<String, Object> syncCurrentUser() {
        return Map.of(
                "message", "User synced",
                "user", authService.syncCurrentClerkUser()
        );
    }
}
