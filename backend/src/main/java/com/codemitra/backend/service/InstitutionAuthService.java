package com.codemitra.backend.service;

import com.codemitra.backend.config.InstitutionAuthenticatedUser;
import com.codemitra.backend.config.InstitutionJwtService;
import com.codemitra.backend.config.InstitutionSecurityUtils;
import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.dto.InstitutionAuthDtos;
import com.codemitra.backend.model.InstitutionEntity;
import com.codemitra.backend.repository.InstitutionRepository;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles email/password authentication for institution accounts.
 */
@Service
public class InstitutionAuthService {

    private final InstitutionRepository institutionRepository;
    private final PasswordEncoder passwordEncoder;
    private final InstitutionJwtService institutionJwtService;
    private final InstitutionSecurityUtils institutionSecurityUtils;

    public InstitutionAuthService(
            InstitutionRepository institutionRepository,
            PasswordEncoder passwordEncoder,
            InstitutionJwtService institutionJwtService,
            InstitutionSecurityUtils institutionSecurityUtils
    ) {
        this.institutionRepository = institutionRepository;
        this.passwordEncoder = passwordEncoder;
        this.institutionJwtService = institutionJwtService;
        this.institutionSecurityUtils = institutionSecurityUtils;
    }

    /**
     * Authenticates one institution account and returns signed institution JWT.
     */
    @Transactional
    public Map<String, Object> login(InstitutionAuthDtos.LoginRequest request) {
        if (request == null || isBlank(request.email()) || isBlank(request.password())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email and password are required");
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        InstitutionEntity institution = institutionRepository.findByLoginEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid institution credentials"));

        if (!"ACTIVE".equalsIgnoreCase(institution.getStatus())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Institution account is not active");
        }

        if (isBlank(institution.getPasswordHash())
                || !passwordEncoder.matches(request.password(), institution.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid institution credentials");
        }

        institution.setLastLoginAt(LocalDateTime.now());
        institution = institutionRepository.save(institution);

        String token = institutionJwtService.issueToken(institution);
        return Map.of(
                "message", "Institution login successful",
                "token", token,
                "institution", toInstitutionSummary(institution)
        );
    }

    /**
     * Returns current institution profile based on authenticated institution principal.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> me() {
        InstitutionEntity institution = requireAuthenticatedInstitution();
        return Map.of("institution", toInstitutionSummary(institution));
    }

    /**
     * Changes institution password and clears forced reset flag.
     */
    @Transactional
    public Map<String, Object> changePassword(InstitutionAuthDtos.ChangePasswordRequest request) {
        if (request == null || isBlank(request.currentPassword()) || isBlank(request.newPassword())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "currentPassword and newPassword are required");
        }

        if (request.newPassword().trim().length() < 8) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "newPassword must be at least 8 characters");
        }

        InstitutionEntity institution = requireAuthenticatedInstitution();
        if (isBlank(institution.getPasswordHash())
                || !passwordEncoder.matches(request.currentPassword(), institution.getPasswordHash())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
        }

        institution.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        institution.setPasswordResetRequired(false);
        institution.setPasswordChangedAt(LocalDateTime.now());
        institutionRepository.save(institution);

        return Map.of(
                "message", "Password updated successfully",
                "institution", toInstitutionSummary(institution)
        );
    }

    /**
     * Resolves current institution entity from authenticated institution principal.
     */
    @Transactional(readOnly = true)
    public InstitutionEntity requireAuthenticatedInstitution() {
        InstitutionAuthenticatedUser principal = institutionSecurityUtils.requireInstitutionPrincipal();
        return institutionRepository.findById(principal.institutionId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Institution not found"));
    }

    private Map<String, Object> toInstitutionSummary(InstitutionEntity institution) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", institution.getId());
        payload.put("name", institution.getName());
        payload.put("code", institution.getCode());
        payload.put("type", institution.getType());
        payload.put("role", RoleMapper.normalize("INSTITUTION_ADMIN"));
        payload.put("status", institution.getStatus());
        payload.put("officialEmail", institution.getOfficialEmail());
        payload.put("loginEmail", institution.getLoginEmail());
        payload.put("contactName", institution.getContactName());
        payload.put("contactEmail", institution.getContactEmail());
        payload.put("contactPhone", institution.getContactPhone());
        payload.put("website", institution.getWebsite());
        payload.put("passwordResetRequired", Boolean.TRUE.equals(institution.getPasswordResetRequired()));
        payload.put("lastLoginAt", institution.getLastLoginAt());
        payload.put("createdAt", institution.getCreatedAt());
        return payload;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}