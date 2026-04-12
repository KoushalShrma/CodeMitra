package com.codemitra.backend.dto;

/**
 * DTOs for institution email/password authentication APIs.
 */
public final class InstitutionAuthDtos {

    private InstitutionAuthDtos() {
    }

    public record LoginRequest(
            String email,
            String password
    ) {
    }

    public record ChangePasswordRequest(
            String currentPassword,
            String newPassword
    ) {
    }
}