package com.codemitra.backend.service;

import com.codemitra.backend.config.AdminAuthenticatedUser;
import com.codemitra.backend.config.AdminJwtService;
import com.codemitra.backend.config.AdminSecurityUtils;
import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.dto.AdminAuthDtos;
import com.codemitra.backend.model.AdminUserEntity;
import com.codemitra.backend.repository.AdminUserRepository;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles super admin setup/login/authenticated profile endpoints.
 */
@Service
public class AdminAuthService {

    public static final String BOOTSTRAP_ADMIN_USERNAME = "koushal";
    public static final String BOOTSTRAP_ADMIN_EMAIL = "koushal@codemitra.com";

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final AdminJwtService adminJwtService;
    private final AdminSecurityUtils adminSecurityUtils;

    public AdminAuthService(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            AdminJwtService adminJwtService,
            AdminSecurityUtils adminSecurityUtils
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.adminJwtService = adminJwtService;
        this.adminSecurityUtils = adminSecurityUtils;
    }

    /**
     * Authenticates existing admin account and returns signed JWT.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> login(AdminAuthDtos.LoginRequest request) {
        String identifier = resolveIdentifier(request);
        validatePassword(request == null ? null : request.password());

        AdminUserEntity adminUser = findByIdentifier(identifier)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials"));

        if (!passwordEncoder.matches(request.password(), adminUser.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin credentials");
        }

        String token = adminJwtService.issueToken(adminUser);
        return Map.of(
                "message", "Admin login successful",
                "token", token,
                "admin", toAdminSummary(adminUser)
        );
    }

    /**
     * Returns current authenticated admin details.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> me() {
        AdminUserEntity adminUser = requireAuthenticatedAdmin();

        return Map.of("admin", toAdminSummary(adminUser));
    }

    /**
     * Lists all admin accounts. Requires canAddAdmins permission.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listAdmins() {
        requireAdminWithAddPermission();
        return Map.of(
                "admins",
                adminUserRepository.findAllByOrderByCreatedAtAscIdAsc()
                        .stream()
                        .map(this::toAdminSummary)
                        .toList()
        );
    }

    /**
     * Creates a new admin account with explicit permission flags.
     */
    @Transactional
    public Map<String, Object> createAdmin(AdminAuthDtos.CreateAdminRequest request) {
        AdminUserEntity creator = requireAdminWithAddPermission();

        if (request == null
                || isBlank(request.name())
                || isBlank(request.username())
                || isBlank(request.email())
                || isBlank(request.password())) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "name, username, email, and password are required"
            );
        }

        String username = request.username().trim().toLowerCase(Locale.ROOT);
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        if (adminUserRepository.existsByUsernameIgnoreCase(username)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Admin username already exists");
        }
        if (adminUserRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Admin email already exists");
        }

        AdminUserEntity adminUser = new AdminUserEntity();
        adminUser.setName(request.name().trim());
        adminUser.setUsername(username);
        adminUser.setEmail(email);
        adminUser.setRole("SUPER_ADMIN");
        adminUser.setCanAddAdmins(Boolean.TRUE.equals(request.canAddAdmins()));
        adminUser.setCanApproveInstitutions(Boolean.TRUE.equals(request.canApproveInstitutions()));
        adminUser.setCreatedByAdminId(creator.getId());
        adminUser.setPasswordHash(passwordEncoder.encode(request.password()));

        AdminUserEntity saved = adminUserRepository.save(adminUser);
        return Map.of(
                "message", "Admin created",
                "admin", toAdminSummary(saved)
        );
    }

    /**
     * Updates permission flags for an admin account.
     */
    @Transactional
    public Map<String, Object> updateAdminPermissions(
            Long adminId,
            AdminAuthDtos.UpdateAdminPermissionsRequest request
    ) {
        requireAdminWithAddPermission();

        if (request == null
                || (request.canAddAdmins() == null && request.canApproveInstitutions() == null)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "canAddAdmins or canApproveInstitutions must be provided"
            );
        }

        AdminUserEntity adminUser = adminUserRepository.findById(adminId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Admin not found"));

        if (request.canAddAdmins() != null) {
            adminUser.setCanAddAdmins(request.canAddAdmins());
        }
        if (request.canApproveInstitutions() != null) {
            adminUser.setCanApproveInstitutions(request.canApproveInstitutions());
        }

        AdminUserEntity saved = adminUserRepository.save(adminUser);
        return Map.of(
                "message", "Admin permissions updated",
                "admin", toAdminSummary(saved)
        );
    }

    /**
     * Resolves authenticated admin and enforces canApproveInstitutions permission.
     */
    @Transactional(readOnly = true)
    public AdminUserEntity requireAdminWithInstitutionApprovalPermission() {
        AdminUserEntity adminUser = requireAuthenticatedAdmin();
        if (!Boolean.TRUE.equals(adminUser.getCanApproveInstitutions())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing institution approval permission");
        }
        return adminUser;
    }

    /**
     * Resolves authenticated admin and enforces canAddAdmins permission.
     */
    @Transactional(readOnly = true)
    public AdminUserEntity requireAdminWithAddPermission() {
        AdminUserEntity adminUser = requireAuthenticatedAdmin();
        if (!Boolean.TRUE.equals(adminUser.getCanAddAdmins())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing admin management permission");
        }
        return adminUser;
    }

    /**
     * Resolves authenticated admin user row from security principal.
     */
    @Transactional(readOnly = true)
    public AdminUserEntity requireAuthenticatedAdmin() {
        AdminAuthenticatedUser principal = adminSecurityUtils.requireAdminPrincipal();
        return adminUserRepository.findById(principal.adminId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin not found"));
    }

    private String resolveIdentifier(AdminAuthDtos.LoginRequest request) {
        String identifier = firstNonBlank(
                request == null ? null : request.identifier(),
                request == null ? null : request.username(),
                request == null ? null : request.email()
        );
        if (isBlank(identifier)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "username or email is required");
        }
        return identifier.trim().toLowerCase(Locale.ROOT);
    }

    private void validatePassword(String password) {
        if (isBlank(password)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "password is required");
        }
    }

    private Optional<AdminUserEntity> findByIdentifier(String identifier) {
        if (identifier.contains("@")) {
            return adminUserRepository.findByEmailIgnoreCase(identifier)
                    .or(() -> adminUserRepository.findByUsernameIgnoreCase(identifier));
        }
        return adminUserRepository.findByUsernameIgnoreCase(identifier)
                .or(() -> adminUserRepository.findByEmailIgnoreCase(identifier));
    }

    private Map<String, Object> toAdminSummary(AdminUserEntity adminUser) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", adminUser.getId());
        payload.put("name", adminUser.getName());
        payload.put("username", adminUser.getUsername());
        payload.put("email", adminUser.getEmail());
        payload.put("role", RoleMapper.normalize(adminUser.getRole()));
        payload.put("canAddAdmins", Boolean.TRUE.equals(adminUser.getCanAddAdmins()));
        payload.put("canApproveInstitutions", Boolean.TRUE.equals(adminUser.getCanApproveInstitutions()));
        payload.put("createdByAdminId", adminUser.getCreatedByAdminId());
        payload.put("createdAt", adminUser.getCreatedAt());
        return payload;
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (!isBlank(value)) {
                return value;
            }
        }
        return null;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
