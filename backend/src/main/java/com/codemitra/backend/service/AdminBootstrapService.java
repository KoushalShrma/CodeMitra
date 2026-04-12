package com.codemitra.backend.service;

import com.codemitra.backend.model.AdminUserEntity;
import com.codemitra.backend.repository.AdminUserRepository;
import jakarta.annotation.PostConstruct;
import java.util.UUID;
import java.util.Locale;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Ensures the fixed bootstrap admin account always exists.
 */
@Component
public class AdminBootstrapService {

    private static final String BOOTSTRAP_NAME = "Koushal";
    private static final String BOOTSTRAP_USERNAME = AdminAuthService.BOOTSTRAP_ADMIN_USERNAME;
    private static final String BOOTSTRAP_EMAIL = AdminAuthService.BOOTSTRAP_ADMIN_EMAIL;

    private final AdminUserRepository adminUserRepository;
    private final PasswordEncoder passwordEncoder;
    private final String bootstrapPassword;

    public AdminBootstrapService(
            AdminUserRepository adminUserRepository,
            PasswordEncoder passwordEncoder,
            @Value("${admin.bootstrap.password:}") String bootstrapPassword
    ) {
        this.adminUserRepository = adminUserRepository;
        this.passwordEncoder = passwordEncoder;
        this.bootstrapPassword = bootstrapPassword == null ? "" : bootstrapPassword.trim();
    }

    /**
     * Creates bootstrap admin on startup when missing and enforces required permissions.
     */
    @PostConstruct
    @Transactional
    public void ensureBootstrapAdmin() {
        AdminUserEntity adminUser = adminUserRepository.findByEmailIgnoreCase(BOOTSTRAP_EMAIL)
                .or(() -> adminUserRepository.findByUsernameIgnoreCase(BOOTSTRAP_USERNAME))
                .orElseGet(AdminUserEntity::new);

        adminUser.setName(BOOTSTRAP_NAME);
        adminUser.setUsername(BOOTSTRAP_USERNAME.toLowerCase(Locale.ROOT));
        adminUser.setEmail(BOOTSTRAP_EMAIL.toLowerCase(Locale.ROOT));
        adminUser.setRole("SUPER_ADMIN");
        adminUser.setCanAddAdmins(true);
        adminUser.setCanApproveInstitutions(true);

        // Never hardcode bootstrap credentials; only apply configured password when provided.
        if (adminUser.getPasswordHash() == null || adminUser.getPasswordHash().isBlank()) {
            String seedPassword = bootstrapPassword.isBlank() ? UUID.randomUUID().toString() : bootstrapPassword;
            adminUser.setPasswordHash(passwordEncoder.encode(seedPassword));
        } else if (!bootstrapPassword.isBlank() && !passwordEncoder.matches(bootstrapPassword, adminUser.getPasswordHash())) {
            adminUser.setPasswordHash(passwordEncoder.encode(bootstrapPassword));
        }

        adminUserRepository.save(adminUser);
    }
}
