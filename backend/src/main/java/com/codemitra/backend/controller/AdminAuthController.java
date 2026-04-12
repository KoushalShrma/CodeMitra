package com.codemitra.backend.controller;

import com.codemitra.backend.dto.AdminAuthDtos;
import com.codemitra.backend.service.AdminAuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Super admin authentication endpoints backed by backend-managed JWT.
 */
@RestController
@RequestMapping("/api/admin/auth")
public class AdminAuthController {

    private final AdminAuthService adminAuthService;

    public AdminAuthController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @PostMapping("/login")
    public Map<String, Object> login(@RequestBody AdminAuthDtos.LoginRequest request) {
        return adminAuthService.login(request);
    }

    @GetMapping("/me")
    public Map<String, Object> me() {
        return adminAuthService.me();
    }
}
