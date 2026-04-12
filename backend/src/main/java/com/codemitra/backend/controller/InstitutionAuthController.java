package com.codemitra.backend.controller;

import com.codemitra.backend.dto.InstitutionAuthDtos;
import com.codemitra.backend.service.InstitutionAuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Institution email/password authentication endpoints.
 */
@RestController
@RequestMapping("/api/institution/auth")
public class InstitutionAuthController {

    private final InstitutionAuthService institutionAuthService;

    public InstitutionAuthController(InstitutionAuthService institutionAuthService) {
        this.institutionAuthService = institutionAuthService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody InstitutionAuthDtos.LoginRequest request) {
        return institutionAuthService.login(request);
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return institutionAuthService.me();
    }

    @PostMapping("/change-password")
    public Map<String, Object> changePassword(@RequestBody InstitutionAuthDtos.ChangePasswordRequest request) {
        return institutionAuthService.changePassword(request);
    }
}