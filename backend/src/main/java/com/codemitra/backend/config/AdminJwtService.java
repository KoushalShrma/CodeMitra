package com.codemitra.backend.config;

import com.codemitra.backend.model.AdminUserEntity;
import com.nimbusds.jose.JOSEException;
import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Issues and verifies backend-managed admin JWTs.
 */
@Component
public class AdminJwtService {

    private final String jwtSecret;
    private final long expirationMinutes;

    public AdminJwtService(
            @Value("${admin.jwt.secret:}") String jwtSecret,
            @Value("${admin.jwt.expiration-minutes:720}") long expirationMinutes
    ) {
        this.jwtSecret = jwtSecret;
        this.expirationMinutes = expirationMinutes;
    }

    /**
     * Creates signed JWT for authenticated admin user.
     */
    public String issueToken(AdminUserEntity adminUser) {
        if (adminUser == null || adminUser.getId() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid admin identity");
        }

        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(String.valueOf(adminUser.getId()))
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
            .claim("username", adminUser.getUsername())
                .claim("email", adminUser.getEmail())
                .claim("role", RoleMapper.normalize(adminUser.getRole()))
                .claim("name", adminUser.getName())
            .claim("canAddAdmins", Boolean.TRUE.equals(adminUser.getCanAddAdmins()))
            .claim("canApproveInstitutions", Boolean.TRUE.equals(adminUser.getCanApproveInstitutions()))
                .build();

        try {
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            signedJWT.sign(new MACSigner(signingKey()));
            return signedJWT.serialize();
        } catch (JOSEException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to sign admin token");
        }
    }

    /**
     * Verifies JWT signature/expiry and maps claims to admin principal.
     */
    public AdminAuthenticatedUser verify(String rawToken) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(rawToken);
            boolean verified = signedJWT.verify(new MACVerifier(signingKey()));
            if (!verified) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin token");
            }

            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
            Date expiration = claimsSet.getExpirationTime();
            if (expiration == null || expiration.before(new Date())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Admin token expired");
            }

            Long adminId = parseAdminId(claimsSet.getSubject());
                String username = readString(claimsSet.getClaim("username"));
            String email = readString(claimsSet.getClaim("email"));
            String role = RoleMapper.normalize(readString(claimsSet.getClaim("role")));
            String name = readString(claimsSet.getClaim("name"));
                boolean canAddAdmins = readBoolean(claimsSet.getClaim("canAddAdmins"));
                boolean canApproveInstitutions = readBoolean(claimsSet.getClaim("canApproveInstitutions"));

                return new AdminAuthenticatedUser(
                    adminId,
                    username,
                    email,
                    role,
                    name,
                    canAddAdmins,
                    canApproveInstitutions
                );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin token");
        }
    }

    private Long parseAdminId(String subject) {
        try {
            return Long.parseLong(subject);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid admin token subject");
        }
    }

    private String readString(Object value) {
        return value == null ? "" : String.valueOf(value);
    }

    private boolean readBoolean(Object value) {
        if (value instanceof Boolean bool) {
            return bool;
        }
        if (value == null) {
            return false;
        }
        return Boolean.parseBoolean(String.valueOf(value));
    }

    private byte[] signingKey() {
        String trimmed = jwtSecret == null ? "" : jwtSecret.trim();
        if (trimmed.isBlank()) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "ADMIN_JWT_SECRET is not configured");
        }

        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(trimmed.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to initialize admin token secret");
        }
    }
}
