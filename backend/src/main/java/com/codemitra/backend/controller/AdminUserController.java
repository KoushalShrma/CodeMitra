package com.codemitra.backend.controller;

import com.codemitra.backend.dto.AdminAuthDtos;
import com.codemitra.backend.service.AdminAuthService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin account management endpoints, restricted to admins with add-admin permission.
 */
@RestController
@RequestMapping("/api/admin/users")
public class AdminUserController {

    private final AdminAuthService adminAuthService;

    public AdminUserController(AdminAuthService adminAuthService) {
        this.adminAuthService = adminAuthService;
    }

    @GetMapping
    public Map<String, Object> listAdmins() {
        return adminAuthService.listAdmins();
    }

    @PostMapping
    public Map<String, Object> createAdmin(@RequestBody AdminAuthDtos.CreateAdminRequest request) {
        return adminAuthService.createAdmin(request);
    }

    @PutMapping("/{adminId}/permissions")
    public Map<String, Object> updateAdminPermissions(
            @PathVariable("adminId") Long adminId,
            @RequestBody AdminAuthDtos.UpdateAdminPermissionsRequest request
    ) {
        return adminAuthService.updateAdminPermissions(adminId, request);
    }
}
