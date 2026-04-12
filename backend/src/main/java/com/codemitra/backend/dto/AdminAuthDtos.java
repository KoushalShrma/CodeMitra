package com.codemitra.backend.dto;

/**
 * DTOs for backend-managed super admin authentication endpoints.
 */
public final class AdminAuthDtos {

    private AdminAuthDtos() {
    }

    public record LoginRequest(
            String identifier,
            String email,
            String username,
            String password
    ) {
    }

    public record CreateAdminRequest(
            String name,
            String username,
            String email,
            String password,
            Boolean canAddAdmins,
            Boolean canApproveInstitutions
    ) {
    }

    public record UpdateAdminPermissionsRequest(
            Boolean canAddAdmins,
            Boolean canApproveInstitutions
    ) {
    }
}
