package com.codemitra.backend.config;

import java.util.Locale;

/**
 * Normalizes mixed legacy and Clerk role values into canonical platform role constants.
 */
public final class RoleMapper {

    private RoleMapper() {
    }

    /**
     * Converts role aliases from legacy/student/institute naming to canonical RBAC role values.
     */
    public static String normalize(String rawRole) {
        if (rawRole == null || rawRole.isBlank()) {
            return "USER";
        }

        String value = rawRole.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        return switch (value) {
            case "STUDENT", "CANDIDATE", "USER" -> "USER";
            case "INSTITUTE", "ADMIN", "INSTITUTION_ADMIN" -> "INSTITUTION_ADMIN";
            case "INSTRUCTOR" -> "INSTRUCTOR";
            case "SUPER_ADMIN", "SUPERADMIN" -> "SUPER_ADMIN";
            default -> value;
        };
    }

    /**
     * Checks whether a canonical role has elevated institution-level access.
     */
    public static boolean isInstitutionLevel(String role) {
        String normalized = normalize(role);
        return "INSTITUTION_ADMIN".equals(normalized)
                || "INSTRUCTOR".equals(normalized)
                || "SUPER_ADMIN".equals(normalized);
    }
}
