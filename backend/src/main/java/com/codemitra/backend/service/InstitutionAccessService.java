package com.codemitra.backend.service;

import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.config.InstitutionAuthenticatedUser;
import com.codemitra.backend.config.InstitutionSecurityUtils;
import com.codemitra.backend.dto.InstitutionDtos;
import com.codemitra.backend.model.AdminUserEntity;
import com.codemitra.backend.model.InstitutionEntity;
import com.codemitra.backend.model.InstitutionJoinRequestEntity;
import com.codemitra.backend.model.InstitutionRequestEntity;
import com.codemitra.backend.model.InstitutionUserEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.repository.InstitutionJoinRequestRepository;
import com.codemitra.backend.repository.InstitutionRepository;
import com.codemitra.backend.repository.InstitutionRequestRepository;
import com.codemitra.backend.repository.InstitutionUserRepository;
import com.codemitra.backend.repository.UserRepository;
import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Implements institution onboarding approval and membership join-request workflows.
 */
@Service
public class InstitutionAccessService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final InstitutionRequestRepository institutionRequestRepository;
    private final InstitutionJoinRequestRepository institutionJoinRequestRepository;
    private final InstitutionRepository institutionRepository;
    private final InstitutionUserRepository institutionUserRepository;
    private final UserRepository userRepository;
    private final AuthService authService;
    private final AdminAuthService adminAuthService;
    private final InstitutionSecurityUtils institutionSecurityUtils;
    private final PasswordEncoder passwordEncoder;
    private final PasswordGeneratorUtil passwordGeneratorUtil;
    private final EmailService emailService;

    public InstitutionAccessService(
            InstitutionRequestRepository institutionRequestRepository,
            InstitutionJoinRequestRepository institutionJoinRequestRepository,
            InstitutionRepository institutionRepository,
            InstitutionUserRepository institutionUserRepository,
            UserRepository userRepository,
            AuthService authService,
            AdminAuthService adminAuthService,
            InstitutionSecurityUtils institutionSecurityUtils,
            PasswordEncoder passwordEncoder,
            PasswordGeneratorUtil passwordGeneratorUtil,
            EmailService emailService
    ) {
        this.institutionRequestRepository = institutionRequestRepository;
        this.institutionJoinRequestRepository = institutionJoinRequestRepository;
        this.institutionRepository = institutionRepository;
        this.institutionUserRepository = institutionUserRepository;
        this.userRepository = userRepository;
        this.authService = authService;
        this.adminAuthService = adminAuthService;
        this.institutionSecurityUtils = institutionSecurityUtils;
        this.passwordEncoder = passwordEncoder;
        this.passwordGeneratorUtil = passwordGeneratorUtil;
        this.emailService = emailService;
    }

    /**
     * Stores one public institution registration request for super admin review.
     */
    @Transactional
    public Map<String, Object> submitInstitutionRequest(InstitutionDtos.SubmitInstitutionRequest request) {
        if (request == null
                || isBlank(request.institutionName())
                || isBlank(request.institutionType())
                || isBlank(request.officialEmail())
                || isBlank(request.contactName())
                || isBlank(request.contactEmail())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "institutionName, institutionType, officialEmail, contactName, and contactEmail are required");
        }

        String officialEmail = request.officialEmail().trim().toLowerCase(Locale.ROOT);
        if (institutionRequestRepository.existsByOfficialEmailIgnoreCaseAndStatus(officialEmail, "PENDING")) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "A pending request already exists for this official email");
        }
        if (institutionRepository.existsByLoginEmailIgnoreCase(officialEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                "An institution account with this email already exists");
        }

        InstitutionRequestEntity entity = new InstitutionRequestEntity();
        entity.setInstitutionName(request.institutionName().trim());
        entity.setInstitutionType(request.institutionType().trim().toUpperCase(Locale.ROOT));
        entity.setOfficialEmail(officialEmail);
        entity.setContactName(request.contactName().trim());
        entity.setContactEmail(request.contactEmail().trim().toLowerCase(Locale.ROOT));
        entity.setContactPhone(blankToNull(request.contactPhone()));
        entity.setWebsite(blankToNull(request.website()));
        entity.setMessage(blankToNull(request.message()));
        entity.setStatus("PENDING");

        InstitutionRequestEntity saved = institutionRequestRepository.save(entity);
        return Map.of(
                "message", "Institution request submitted",
                "request", toInstitutionRequestSummary(saved)
        );
    }

    /**
     * Returns discoverable active institutions with join codes.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listDiscoverableInstitutions() {
        List<Map<String, Object>> institutions = institutionRepository.findByStatusOrderByNameAsc("ACTIVE")
                .stream()
                .map(this::toInstitutionSummary)
                .toList();
        return Map.of("institutions", institutions);
    }

    /**
     * Lists institution requests filtered by status for super admin dashboard.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listInstitutionRequests(String status) {
        adminAuthService.requireAdminWithInstitutionApprovalPermission();
        List<InstitutionRequestEntity> requests;
        if (status == null || status.isBlank()) {
            requests = institutionRequestRepository.findAllByOrderByCreatedAtDesc();
        } else {
            requests = institutionRequestRepository.findByStatusOrderByCreatedAtAsc(status.trim().toUpperCase(Locale.ROOT));
        }

        return Map.of(
                "requests",
                requests.stream().map(this::toInstitutionRequestSummary).toList()
        );
    }

            /**
             * Lists institutions for super admin operations like deactivate/remove.
             */
            @Transactional(readOnly = true)
            public Map<String, Object> listInstitutionsForAdmin(String status) {
            adminAuthService.requireAdminWithInstitutionApprovalPermission();

            List<InstitutionEntity> institutions = (status == null || status.isBlank())
                ? institutionRepository.findAll()
                : institutionRepository.findByStatusOrderByNameAsc(status.trim().toUpperCase(Locale.ROOT));

            List<Map<String, Object>> rows = institutions.stream()
                .sorted(Comparator.comparing(InstitutionEntity::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .map(this::toAdminInstitutionSummary)
                .toList();

            return Map.of("institutions", rows);
            }

    /**
     * Approves one institution request and creates active institution workspace.
     */
    @Transactional
    public Map<String, Object> approveInstitutionRequest(Long requestId, InstitutionDtos.ReviewInstitutionRequest request) {
        AdminUserEntity admin = adminAuthService.requireAdminWithInstitutionApprovalPermission();
        InstitutionRequestEntity entity = institutionRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution request not found"));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending requests can be approved");
        }

        InstitutionEntity institution = new InstitutionEntity();
        institution.setName(entity.getInstitutionName());
        institution.setType(entity.getInstitutionType());
        institution.setSubscriptionTier("FREE");
        institution.setStatus("ACTIVE");
        institution.setApprovedByAdminId(admin.getId());
        institution.setApprovedAt(LocalDateTime.now());
        institution.setOfficialEmail(entity.getOfficialEmail());
        institution.setContactName(entity.getContactName());
        institution.setContactEmail(entity.getContactEmail());
        institution.setContactPhone(entity.getContactPhone());
        institution.setWebsite(entity.getWebsite());

        String requestedCode = request == null ? null : request.institutionCode();
        institution.setCode(resolveInstitutionCode(requestedCode, entity.getInstitutionName()));

        String requestedLoginEmail = request == null ? null : request.loginEmail();
        String loginEmail = resolveInstitutionLoginEmail(requestedLoginEmail, entity.getOfficialEmail());
        if (institutionRepository.existsByLoginEmailIgnoreCase(loginEmail)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Institution login email already exists");
        }

        String temporaryPassword = passwordGeneratorUtil.generateTemporaryPassword();
        institution.setLoginEmail(loginEmail);
        institution.setPasswordHash(passwordEncoder.encode(temporaryPassword));
        institution.setPasswordResetRequired(true);
        institution.setPasswordChangedAt(null);

        InstitutionEntity savedInstitution = institutionRepository.save(institution);

        EmailService.EmailDispatchResult dispatchResult = emailService.sendInstitutionCredentialsEmail(
            entity.getOfficialEmail(),
            entity.getContactEmail(),
            savedInstitution.getName(),
            loginEmail,
            temporaryPassword,
            entity.getId(),
            savedInstitution.getId()
        );

        entity.setStatus("APPROVED");
        entity.setReviewedAt(LocalDateTime.now());
        entity.setReviewedByAdminId(admin.getId());
        entity.setApprovedInstitutionId(savedInstitution.getId());
        entity.setCredentialsEmailStatus(dispatchResult.status());
        entity.setCredentialsEmailedAt(dispatchResult.success() ? LocalDateTime.now() : null);
        institutionRequestRepository.save(entity);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", "Institution request approved");
        response.put("institution", toInstitutionSummary(savedInstitution));
        response.put("request", toInstitutionRequestSummary(entity));
        response.put("credentialsEmail", Map.of(
            "status", dispatchResult.status(),
            "success", dispatchResult.success(),
            "error", dispatchResult.errorMessage() == null ? "" : dispatchResult.errorMessage(),
            "emailLogId", dispatchResult.emailLogId()
        ));
        return response;
    }

    /**
     * Rejects one institution request.
     */
    @Transactional
    public Map<String, Object> rejectInstitutionRequest(Long requestId, InstitutionDtos.ReviewInstitutionRequest request) {
        AdminUserEntity admin = adminAuthService.requireAdminWithInstitutionApprovalPermission();
        InstitutionRequestEntity entity = institutionRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution request not found"));

        if (!"PENDING".equalsIgnoreCase(entity.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending requests can be rejected");
        }

        entity.setStatus("REJECTED");
        entity.setReviewedAt(LocalDateTime.now());
        entity.setReviewedByAdminId(admin.getId());

        if (request != null && !isBlank(request.note())) {
            entity.setMessage(appendNote(entity.getMessage(), request.note().trim()));
        }

        InstitutionRequestEntity saved = institutionRequestRepository.save(entity);
        return Map.of(
                "message", "Institution request rejected",
                "request", toInstitutionRequestSummary(saved)
        );
    }

        /**
         * Removes one institution from active access and clears memberships/join requests.
         */
        @Transactional
        public Map<String, Object> removeInstitution(Long institutionId) {
        AdminUserEntity admin = adminAuthService.requireAdminWithInstitutionApprovalPermission();
        InstitutionEntity institution = institutionRepository.findById(institutionId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"));

        if ("REMOVED".equalsIgnoreCase(institution.getStatus())) {
            return Map.of(
                "message", "Institution already removed",
                "institution", toAdminInstitutionSummary(institution)
            );
        }

        institutionJoinRequestRepository.deleteByInstitutionId(institutionId);
        institutionUserRepository.deleteByInstitutionId(institutionId);

        institution.setStatus("REMOVED");
        institution.setPasswordHash(null);
        institution.setPasswordResetRequired(true);
        institution.setLoginEmail(null);
        institution.setApprovedByAdminId(admin.getId());

        InstitutionEntity saved = institutionRepository.save(institution);
        return Map.of(
            "message", "Institution removed",
            "institution", toAdminInstitutionSummary(saved)
        );
        }

    /**
     * Creates one student request to join an institution by id or code.
     */
    @Transactional
    public Map<String, Object> submitJoinRequest(InstitutionDtos.SubmitInstitutionJoinRequest request) {
        if (request == null || (request.institutionId() == null && isBlank(request.institutionCode()))) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "institutionId or institutionCode is required");
        }

        UserEntity currentUser = authService.getOrCreateCurrentUser();
        InstitutionEntity institution = resolveInstitution(request.institutionId(), request.institutionCode());

        institutionUserRepository.findByUserIdAndInstitutionId(currentUser.getId(), institution.getId())
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "You are already a member of this institution");
                });

        institutionJoinRequestRepository.findByInstitutionIdAndUserIdAndStatus(institution.getId(), currentUser.getId(), "PENDING")
                .ifPresent(existing -> {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "A join request is already pending");
                });

        InstitutionJoinRequestEntity joinRequest = new InstitutionJoinRequestEntity();
        joinRequest.setInstitutionId(institution.getId());
        joinRequest.setUserId(currentUser.getId());
        joinRequest.setMessage(blankToNull(request.message()));
        joinRequest.setStatus("PENDING");

        InstitutionJoinRequestEntity saved = institutionJoinRequestRepository.save(joinRequest);
        return Map.of(
                "message", "Join request submitted",
                "request", toJoinRequestSummary(saved, currentUser)
        );
    }

    /**
     * Lists pending join requests for one institution.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listJoinRequests(Long institutionId) {
        requireInstitutionAdmin(institutionId);
        institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"));

        List<Map<String, Object>> rows = institutionJoinRequestRepository
                .findByInstitutionIdOrderByCreatedAtAsc(institutionId)
                .stream()
                .filter(item -> "PENDING".equalsIgnoreCase(normalizeStatus(item.getStatus())))
                .map(item -> {
                    UserEntity user = userRepository.findById(item.getUserId()).orElse(null);
                    return toJoinRequestSummary(item, user);
                })
                .toList();

        return Map.of("requests", rows);
    }

    /**
     * Lists current institution members and roles.
     */
    @Transactional(readOnly = true)
    public Map<String, Object> listInstitutionMembers(Long institutionId) {
        requireInstitutionAdmin(institutionId);
        institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"));

        List<Map<String, Object>> rows = institutionUserRepository.findByInstitutionId(institutionId)
                .stream()
                .map(member -> {
                    UserEntity user = userRepository.findById(member.getUserId()).orElse(null);
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("membershipId", member.getId());
                    row.put("userId", member.getUserId());
                    row.put("name", user == null ? "Unknown" : user.getName());
                    row.put("email", user == null ? "" : user.getEmail());
                    row.put("role", RoleMapper.normalize(member.getRole()));
                    row.put("createdAt", member.getCreatedAt());
                    return row;
                })
                .toList();

        return Map.of("members", rows);
    }

    /**
     * Deregisters one existing institution member.
     */
    @Transactional
    public Map<String, Object> deregisterInstitutionMember(Long institutionId, Long membershipId) {
        requireInstitutionAdmin(institutionId);

        InstitutionUserEntity membership = institutionUserRepository.findByIdAndInstitutionId(membershipId, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution member not found"));

        String membershipRole = RoleMapper.normalize(membership.getRole());
        if (isInstitutionAdminRole(membershipRole)) {
            long adminCount = institutionUserRepository.findByInstitutionId(institutionId)
                    .stream()
                    .filter(item -> isInstitutionAdminRole(RoleMapper.normalize(item.getRole())))
                    .count();
            if (adminCount <= 1) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot remove the last institution admin");
            }
        }

        institutionUserRepository.delete(membership);
        return Map.of(
                "message", "Member deregistered",
                "membershipId", membership.getId(),
                "userId", membership.getUserId()
        );
    }

    /**
     * Approves one join request and creates membership row.
     */
    @Transactional
    public Map<String, Object> approveJoinRequest(
            Long institutionId,
            Long joinRequestId,
            InstitutionDtos.ReviewInstitutionJoinRequest request
    ) {
        Long reviewerInstitutionId = requireInstitutionAdmin(institutionId);

        InstitutionJoinRequestEntity joinRequest = institutionJoinRequestRepository
                .findByIdAndInstitutionId(joinRequestId, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Join request not found"));

        if (!"PENDING".equalsIgnoreCase(joinRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending join requests can be approved");
        }

        String requestedRole = request == null ? null : request.role();
        String role = normalizeJoinRole(requestedRole);

        InstitutionUserEntity membership = institutionUserRepository
                .findByUserIdAndInstitutionId(joinRequest.getUserId(), institutionId)
                .orElseGet(InstitutionUserEntity::new);
        membership.setInstitutionId(institutionId);
        membership.setUserId(joinRequest.getUserId());
        membership.setRole(role);
        institutionUserRepository.save(membership);

        joinRequest.setStatus("APPROVED");
        joinRequest.setReviewedByUserId(null);
        joinRequest.setReviewedByInstitutionId(reviewerInstitutionId);
        joinRequest.setReviewedAt(LocalDateTime.now());
        institutionJoinRequestRepository.save(joinRequest);

        return Map.of(
                "message", "Join request approved",
                "membership", Map.of(
                        "userId", membership.getUserId(),
                        "institutionId", membership.getInstitutionId(),
                        "role", RoleMapper.normalize(membership.getRole())
                )
        );
    }

    /**
     * Rejects one join request.
     */
    @Transactional
    public Map<String, Object> rejectJoinRequest(
            Long institutionId,
            Long joinRequestId,
            InstitutionDtos.ReviewInstitutionJoinRequest request
    ) {
        Long reviewerInstitutionId = requireInstitutionAdmin(institutionId);

        InstitutionJoinRequestEntity joinRequest = institutionJoinRequestRepository
                .findByIdAndInstitutionId(joinRequestId, institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Join request not found"));

        if (!"PENDING".equalsIgnoreCase(joinRequest.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Only pending join requests can be rejected");
        }

        joinRequest.setStatus("REJECTED");
        joinRequest.setReviewedByUserId(null);
        joinRequest.setReviewedByInstitutionId(reviewerInstitutionId);
        joinRequest.setReviewedAt(LocalDateTime.now());
        if (request != null && !isBlank(request.note())) {
            joinRequest.setMessage(appendNote(joinRequest.getMessage(), request.note().trim()));
        }
        institutionJoinRequestRepository.save(joinRequest);

        return Map.of("message", "Join request rejected");
    }

    private Long requireInstitutionAdmin(Long institutionId) {
        InstitutionAuthenticatedUser principal = institutionSecurityUtils.requireInstitutionPrincipal();
        if (!principal.institutionId().equals(institutionId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }
        InstitutionEntity institution = institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"));
        if (!"ACTIVE".equalsIgnoreCase(institution.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Institution account is not active");
        }
        return principal.institutionId();
    }

    private InstitutionEntity resolveInstitution(Long institutionId, String institutionCode) {
        InstitutionEntity institution = institutionId == null
                ? institutionRepository.findByCodeIgnoreCase(institutionCode == null ? "" : institutionCode.trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"))
                : institutionRepository.findById(institutionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Institution not found"));

        if (!"ACTIVE".equalsIgnoreCase(institution.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Institution is not active");
        }

        return institution;
    }

    private String resolveInstitutionCode(String requestedCode, String institutionName) {
        if (!isBlank(requestedCode)) {
            String cleaned = requestedCode.trim().toUpperCase(Locale.ROOT);
            if (institutionRepository.existsByCodeIgnoreCase(cleaned)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Institution code already exists");
            }
            return cleaned;
        }

        String candidate = generateInstitutionCode(institutionName);
        while (institutionRepository.existsByCodeIgnoreCase(candidate)) {
            candidate = generateInstitutionCode(institutionName);
        }
        return candidate;
    }

    private String resolveInstitutionLoginEmail(String requestedLoginEmail, String fallbackOfficialEmail) {
        String candidate = !isBlank(requestedLoginEmail) ? requestedLoginEmail : fallbackOfficialEmail;
        if (isBlank(candidate)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Institution login email is required");
        }
        return candidate.trim().toLowerCase(Locale.ROOT);
    }

    private String generateInstitutionCode(String name) {
        String normalized = name == null ? "INST" : name.toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]", "");
        String prefix = (normalized + "INST").substring(0, 4);
        int random = RANDOM.nextInt(10000);
        return "INST-" + prefix + "-" + String.format(Locale.ROOT, "%04d", random);
    }

    private String normalizeJoinRole(String rawRole) {
        String normalized = RoleMapper.normalize(rawRole);
        if ("INSTITUTION_ADMIN".equals(normalized) || "INSTRUCTOR".equals(normalized)) {
            return normalized;
        }
        return "USER";
    }

    private Map<String, Object> toInstitutionSummary(InstitutionEntity institution) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", institution.getId());
        payload.put("name", institution.getName());
        payload.put("code", institution.getCode() == null ? "" : institution.getCode());
        payload.put("type", institution.getType());
        payload.put("status", institution.getStatus() == null ? "ACTIVE" : institution.getStatus());
        payload.put("subscriptionTier", institution.getSubscriptionTier());
        payload.put("createdAt", institution.getCreatedAt());
        return payload;
    }

    private Map<String, Object> toAdminInstitutionSummary(InstitutionEntity institution) {
        Map<String, Object> payload = new LinkedHashMap<>(toInstitutionSummary(institution));
        payload.put("officialEmail", institution.getOfficialEmail() == null ? "" : institution.getOfficialEmail());
        payload.put("loginEmail", institution.getLoginEmail() == null ? "" : institution.getLoginEmail());
        payload.put("approvedByAdminId", institution.getApprovedByAdminId());
        payload.put("approvedAt", institution.getApprovedAt());
        payload.put("updatedAt", institution.getUpdatedAt());
        return payload;
    }

    private Map<String, Object> toInstitutionRequestSummary(InstitutionRequestEntity entity) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", entity.getId());
        payload.put("institutionName", entity.getInstitutionName());
        payload.put("institutionType", entity.getInstitutionType());
        payload.put("officialEmail", entity.getOfficialEmail());
        payload.put("contactName", entity.getContactName());
        payload.put("contactEmail", entity.getContactEmail());
        payload.put("contactPhone", entity.getContactPhone() == null ? "" : entity.getContactPhone());
        payload.put("website", entity.getWebsite() == null ? "" : entity.getWebsite());
        payload.put("message", entity.getMessage() == null ? "" : entity.getMessage());
        payload.put("status", entity.getStatus());
        payload.put("reviewedByAdminId", entity.getReviewedByAdminId());
        payload.put("approvedInstitutionId", entity.getApprovedInstitutionId());
        payload.put("credentialsEmailStatus", entity.getCredentialsEmailStatus());
        payload.put("credentialsEmailedAt", entity.getCredentialsEmailedAt());
        payload.put("reviewedAt", entity.getReviewedAt());
        payload.put("createdAt", entity.getCreatedAt());
        payload.put("updatedAt", entity.getUpdatedAt());
        return payload;
    }

    private Map<String, Object> toJoinRequestSummary(InstitutionJoinRequestEntity item, UserEntity user) {
        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("id", item.getId());
        payload.put("institutionId", item.getInstitutionId());
        payload.put("userId", item.getUserId());
        payload.put("name", user == null ? "Unknown" : user.getName());
        payload.put("email", user == null ? "" : user.getEmail());
        payload.put("message", item.getMessage() == null ? "" : item.getMessage());
        payload.put("status", item.getStatus());
        payload.put("reviewedByUserId", item.getReviewedByUserId());
        payload.put("reviewedByInstitutionId", item.getReviewedByInstitutionId());
        payload.put("reviewedAt", item.getReviewedAt());
        payload.put("createdAt", item.getCreatedAt());
        return payload;
    }

    private String appendNote(String current, String note) {
        if (isBlank(current)) {
            return note;
        }
        return current + "\n\n[Admin Note] " + note;
    }

    private String normalizeStatus(String status) {
        return status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
    }

    private boolean isInstitutionAdminRole(String role) {
        return "INSTITUTION_ADMIN".equalsIgnoreCase(role) || "INSTRUCTOR".equalsIgnoreCase(role);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private String blankToNull(String value) {
        return isBlank(value) ? null : value.trim();
    }
}
