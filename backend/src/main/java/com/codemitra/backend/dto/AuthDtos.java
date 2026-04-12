package com.codemitra.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTOs used for authentication/account APIs.
 */
public final class AuthDtos {

    private AuthDtos() {
    }

    /**
     * Payload for student signup.
     */
    public record SignupRequest(
            @NotBlank String name,
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    /**
     * Payload for institute registration.
     */
    public record InstituteRegisterRequest(
            @NotBlank String instituteName,
            @NotBlank @Email String email,
            @NotBlank String password,
            @NotBlank String contactNumber,
            @NotBlank String address,
            @NotBlank String city,
            @NotBlank String state,
            String website
    ) {
    }

    /**
     * Payload for legacy login API compatibility.
     */
    public record LoginRequest(
            @NotBlank @Email String email,
            @NotBlank String password
    ) {
    }

    /**
     * User details returned to the frontend.
     */
    public record UserResponse(
            Long id,
            String name,
            String email,
            String role,
            String instituteCode,
            String profileImage
    ) {
    }
}
