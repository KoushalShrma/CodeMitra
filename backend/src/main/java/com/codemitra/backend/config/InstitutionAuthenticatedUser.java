package com.codemitra.backend.config;

/**
 * Security principal populated for institution email/password JWT sessions.
 */
public record InstitutionAuthenticatedUser(
        Long institutionId,
        String email,
        String role,
        String name,
        String code,
        boolean passwordResetRequired
) {
}