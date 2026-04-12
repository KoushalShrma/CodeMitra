package com.codemitra.backend.service;

import com.codemitra.backend.config.AuthenticatedUser;
import com.codemitra.backend.config.RoleMapper;
import com.codemitra.backend.config.SecurityUtils;
import com.codemitra.backend.dto.AuthDtos;
import com.codemitra.backend.model.InstituteEntity;
import com.codemitra.backend.model.PerformanceEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.repository.InstituteRepository;
import com.codemitra.backend.repository.PerformanceRepository;
import com.codemitra.backend.repository.UserRepository;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Handles account lifecycle logic and Clerk-to-local user synchronization.
 */
@Service
public class AuthService {

    private static final SecureRandom RANDOM = new SecureRandom();

    private final UserRepository userRepository;
    private final InstituteRepository instituteRepository;
    private final PerformanceRepository performanceRepository;
    private final PasswordEncoder passwordEncoder;
    private final SecurityUtils securityUtils;

    public AuthService(
            UserRepository userRepository,
            InstituteRepository instituteRepository,
            PerformanceRepository performanceRepository,
            PasswordEncoder passwordEncoder,
            SecurityUtils securityUtils
    ) {
        this.userRepository = userRepository;
        this.instituteRepository = instituteRepository;
        this.performanceRepository = performanceRepository;
        this.passwordEncoder = passwordEncoder;
        this.securityUtils = securityUtils;
    }

    /**
     * Legacy signup endpoint retained for compatibility with prior API surface.
     */
    @Transactional
    public Map<String, Object> signup(AuthDtos.SignupRequest request) {
        if (request.name() == null || request.name().isBlank() || request.email() == null || request.email().isBlank() || request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name, email, and password are required");
        }

        if (userRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");
        }

        UserEntity user = new UserEntity();
        user.setName(request.name().trim());
        user.setEmail(request.email().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setRole("USER");
        user.setClerkId("legacy-" + randomToken());
        UserEntity saved = userRepository.save(user);

        PerformanceEntity performance = new PerformanceEntity();
        performance.setUserId(saved.getId());
        performanceRepository.save(performance);

        return Map.of(
                "message", "User created successfully",
                "user", new AuthDtos.UserResponse(saved.getId(), saved.getName(), saved.getEmail(), "USER", null, saved.getProfileImage())
        );
    }

    /**
     * Registers institutes for backwards-compatible institute onboarding paths.
     */
    @Transactional
    public Map<String, Object> registerInstitute(AuthDtos.InstituteRegisterRequest request) {
        if (request.instituteName() == null || request.instituteName().isBlank()
                || request.email() == null || request.email().isBlank()
                || request.password() == null || request.password().isBlank()
                || request.contactNumber() == null || request.contactNumber().isBlank()
                || request.address() == null || request.address().isBlank()
                || request.city() == null || request.city().isBlank()
                || request.state() == null || request.state().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "instituteName, email, password, contactNumber, address, city, and state are required");
        }

        if (instituteRepository.existsByEmailIgnoreCase(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Institute with this email already exists");
        }

        String instituteCode = generateUniqueInstituteCode(request.instituteName());

        InstituteEntity institute = new InstituteEntity();
        institute.setInstituteName(request.instituteName().trim());
        institute.setEmail(request.email().trim().toLowerCase());
        institute.setPassword(passwordEncoder.encode(request.password()));
        institute.setContactNumber(request.contactNumber().trim());
        institute.setAddress(request.address().trim());
        institute.setCity(request.city().trim());
        institute.setState(request.state().trim());
        institute.setWebsite(request.website() == null || request.website().isBlank() ? null : request.website().trim());
        institute.setInstituteCode(instituteCode);

        InstituteEntity saved = instituteRepository.save(institute);

        return Map.of(
                "message", "Institute registered successfully",
                "institute", Map.of(
                        "id", saved.getId(),
                        "instituteName", saved.getInstituteName(),
                        "email", saved.getEmail(),
                        "contactNumber", saved.getContactNumber(),
                        "city", saved.getCity(),
                        "state", saved.getState(),
                        "website", saved.getWebsite() == null ? "" : saved.getWebsite(),
                        "instituteCode", saved.getInstituteCode(),
                        "role", "INSTITUTION_ADMIN"
                )
        );
    }

    /**
     * Legacy login endpoint retained for compatibility with prior frontend flows.
     */
    public Map<String, Object> login(AuthDtos.LoginRequest request) {
        if (request.email() == null || request.email().isBlank() || request.password() == null || request.password().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email and password are required");
        }

        return userRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
                .filter(user -> passwordEncoder.matches(request.password(), user.getPassword()))
                .<Map<String, Object>>map(user -> Map.of(
                        "message", "Login successful",
                    "user", new AuthDtos.UserResponse(user.getId(), user.getName(), user.getEmail(), RoleMapper.normalize(user.getRole()), null, user.getProfileImage())
                ))
                .or(() -> instituteRepository.findByEmailIgnoreCase(request.email().trim().toLowerCase())
                        .filter(inst -> passwordEncoder.matches(request.password(), inst.getPassword()))
                        .map(inst -> Map.of(
                                "message", "Login successful",
                        "user", new AuthDtos.UserResponse(inst.getId(), inst.getInstituteName(), inst.getEmail(), "INSTITUTION_ADMIN", inst.getInstituteCode(), null)
                        )))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid email or password"));
    }

    /**
     * Ensures a local user exists for current Clerk principal and returns synchronized profile.
     */
    @Transactional
    public AuthDtos.UserResponse syncCurrentClerkUser() {
        UserEntity user = getOrCreateCurrentUser();
        return new AuthDtos.UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                RoleMapper.normalize(user.getRole()),
                null,
                user.getProfileImage()
        );
    }

    /**
     * Resolves current authenticated principal and lazy-creates local user if needed.
     */
    @Transactional
    public UserEntity getOrCreateCurrentUser() {
        AuthenticatedUser principal = securityUtils.requirePrincipal();
        return userRepository.findByClerkId(principal.clerkUserId())
                .map(existing -> updateUserFromPrincipal(existing, principal))
                .orElseGet(() -> createUserFromPrincipal(principal));
    }

    /**
     * Returns principal object for services that need Clerk claims.
     */
    public AuthenticatedUser currentPrincipal() {
        return securityUtils.requirePrincipal();
    }

    /**
     * Converts user id inputs, supporting "me" while enforcing ownership for students.
     */
    @Transactional(readOnly = true)
    public Long resolveUserId(String userIdPathOrMe) {
        UserEntity currentUser = getOrCreateCurrentUser();
        if (userIdPathOrMe == null || userIdPathOrMe.isBlank() || "me".equalsIgnoreCase(userIdPathOrMe)) {
            return currentUser.getId();
        }
        long requested;
        try {
            requested = Long.parseLong(userIdPathOrMe);
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid user id");
        }

        // Students can only access their own resources; institute role can inspect by explicit user id.
        String role = RoleMapper.normalize(currentPrincipal().role());
        if (!RoleMapper.isInstitutionLevel(role) && requested != currentUser.getId()) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Forbidden");
        }

        return requested;
    }

    private UserEntity createUserFromPrincipal(AuthenticatedUser principal) {
        UserEntity user = new UserEntity();
        user.setClerkId(principal.clerkUserId());
        user.setEmail(normalizeEmail(principal));
        user.setName(normalizeName(principal));
        user.setProfileImage(principal.imageUrl());
        user.setRole(RoleMapper.normalize(principal.role()));
        user.setPassword(passwordEncoder.encode("clerk-" + randomToken()));

        UserEntity saved = userRepository.save(user);
        PerformanceEntity performance = new PerformanceEntity();
        performance.setUserId(saved.getId());
        performanceRepository.save(performance);
        return saved;
    }

    private UserEntity updateUserFromPrincipal(UserEntity existing, AuthenticatedUser principal) {
        boolean changed = false;

        String nextEmail = normalizeEmail(principal);
        if (existing.getEmail() == null || !existing.getEmail().equalsIgnoreCase(nextEmail)) {
            existing.setEmail(nextEmail);
            changed = true;
        }

        String nextName = normalizeName(principal);
        if (existing.getName() == null || existing.getName().isBlank()) {
            existing.setName(nextName);
            changed = true;
        }

        if ((existing.getProfileImage() == null || existing.getProfileImage().isBlank())
                && principal.imageUrl() != null && !principal.imageUrl().isBlank()) {
            existing.setProfileImage(principal.imageUrl());
            changed = true;
        }

        String nextRole = RoleMapper.normalize(principal.role());
        if (!nextRole.equalsIgnoreCase(existing.getRole())) {
            existing.setRole(nextRole);
            changed = true;
        }

        return changed ? userRepository.save(existing) : existing;
    }

    private String normalizeName(AuthenticatedUser principal) {
        if (principal.fullName() != null && !principal.fullName().isBlank()) {
            return principal.fullName().trim();
        }

        if (principal.email() != null && !principal.email().isBlank()) {
            String localPart = principal.email().trim();
            int atIndex = localPart.indexOf('@');
            if (atIndex > 0) {
                localPart = localPart.substring(0, atIndex);
            }
            localPart = localPart.replaceAll("[^A-Za-z0-9._-]", " ").trim();
            if (!localPart.isBlank()) {
                return localPart;
            }
        }

        return "Learner";
    }

    private String normalizeEmail(AuthenticatedUser principal) {
        if (principal.email() != null && !principal.email().isBlank()) {
            return principal.email().trim().toLowerCase();
        }
        return principal.clerkUserId() + "@clerk.local";
    }

    private String generateUniqueInstituteCode(String instituteName) {
        String candidate = buildInstituteCode(instituteName);
        while (instituteRepository.existsByInstituteCode(candidate)) {
            candidate = buildInstituteCode(instituteName);
        }
        return candidate;
    }

    private String buildInstituteCode(String instituteName) {
        String normalized = instituteName == null ? "" : instituteName.toUpperCase().replaceAll("[^A-Z0-9]", "");
        String prefix = (normalized + "XXXX").substring(0, 4);
        return "INST-" + prefix + "-" + randomToken().substring(0, 6).toUpperCase();
    }

    private String randomToken() {
        byte[] bytes = new byte[12];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
