package com.codemitra.backend.config;

/**
 * Security principal populated from backend-issued admin JWT.
 */
public record AdminAuthenticatedUser(
        Long adminId,
        String username,
        String email,
        String role,
        String name,
        boolean canAddAdmins,
        boolean canApproveInstitutions
) {
}
