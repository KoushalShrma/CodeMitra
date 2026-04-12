package com.codemitra.backend.config;

import java.util.Map;

/**
 * Security principal populated after successful Clerk JWT verification.
 */
public record AuthenticatedUser(
        String clerkUserId,
        String email,
        String fullName,
        String role,
        String imageUrl,
        Map<String, Object> claims
) {
}
