package com.codemitra.backend.config;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Helper to safely access authenticated Clerk principal from Spring Security context.
 */
@Component
public class SecurityUtils {

    /**
     * Returns current authenticated principal or throws when absent.
     */
    public AuthenticatedUser requirePrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || !(authentication.getPrincipal() instanceof AuthenticatedUser principal)) {
            throw new IllegalStateException("Missing authenticated principal");
        }
        return principal;
    }
}
