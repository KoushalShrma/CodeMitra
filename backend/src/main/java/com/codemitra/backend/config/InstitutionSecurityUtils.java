package com.codemitra.backend.config;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Helper for reading institution principal from Spring Security context.
 */
@Component
public class InstitutionSecurityUtils {

    /**
     * Returns authenticated institution principal or throws 401 when absent.
     */
    public InstitutionAuthenticatedUser requireInstitutionPrincipal() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !(authentication.getPrincipal() instanceof InstitutionAuthenticatedUser principal)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Institution authentication required");
        }
        return principal;
    }
}