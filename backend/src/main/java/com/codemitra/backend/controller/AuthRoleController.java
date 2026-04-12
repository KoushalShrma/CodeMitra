package com.codemitra.backend.controller;

import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.model.InstitutionUserEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.repository.InstitutionUserRepository;
import com.codemitra.backend.service.AuthService;
import java.util.List;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Returns authenticated Clerk user's resolved role and institution memberships.
 */
@RestController
public class AuthRoleController {

    private final AuthService authService;
    private final InstitutionUserRepository institutionUserRepository;

    public AuthRoleController(AuthService authService, InstitutionUserRepository institutionUserRepository) {
        this.authService = authService;
        this.institutionUserRepository = institutionUserRepository;
    }

    @GetMapping("/api/auth/role")
    public Map<String, Object> getCurrentRole() {
        UserEntity user = authService.getOrCreateCurrentUser();
        List<Map<String, Object>> memberships = institutionUserRepository.findByUserId(user.getId())
                .stream()
                .map(this::toMembershipSummary)
                .toList();

        return Map.of(
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", RoleMapper.normalize(user.getRole())
                ),
                "memberships", memberships
        );
    }

    private Map<String, Object> toMembershipSummary(InstitutionUserEntity item) {
        return Map.of(
                "institutionId", item.getInstitutionId(),
                "role", RoleMapper.normalize(item.getRole()),
                "createdAt", item.getCreatedAt()
        );
    }
}
