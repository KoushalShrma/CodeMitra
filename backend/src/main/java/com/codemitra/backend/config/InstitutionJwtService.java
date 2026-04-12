package com.codemitra.backend.config;

import com.codemitra.backend.model.InstitutionEntity;
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
 * Issues and verifies backend-managed JWTs for institution accounts.
 */
@Component
public class InstitutionJwtService {

    private final String jwtSecret;
    private final long expirationMinutes;

    public InstitutionJwtService(
            @Value("${institution.jwt.secret:}") String jwtSecret,
            @Value("${institution.jwt.expiration-minutes:720}") long expirationMinutes
    ) {
        this.jwtSecret = jwtSecret;
        this.expirationMinutes = expirationMinutes;
    }

    /**
     * Creates a signed JWT for one authenticated institution account.
     */
    public String issueToken(InstitutionEntity institution) {
        if (institution == null || institution.getId() == null) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Invalid institution identity");
        }

        Instant now = Instant.now();
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .subject(String.valueOf(institution.getId()))
                .issueTime(Date.from(now))
                .expirationTime(Date.from(now.plus(expirationMinutes, ChronoUnit.MINUTES)))
                .claim("email", institution.getLoginEmail())
                .claim("role", "INSTITUTION_ADMIN")
                .claim("name", institution.getName())
                .claim("code", institution.getCode())
                .claim("passwordResetRequired", Boolean.TRUE.equals(institution.getPasswordResetRequired()))
                .build();

        try {
            SignedJWT signedJWT = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
            signedJWT.sign(new MACSigner(signingKey()));
            return signedJWT.serialize();
        } catch (JOSEException ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR, "Unable to sign institution token");
        }
    }

    /**
     * Verifies JWT signature and expiration and maps claims to principal.
     */
    public InstitutionAuthenticatedUser verify(String rawToken) {
        try {
            SignedJWT signedJWT = SignedJWT.parse(rawToken);
            boolean verified = signedJWT.verify(new MACVerifier(signingKey()));
            if (!verified) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid institution token");
            }

            JWTClaimsSet claimsSet = signedJWT.getJWTClaimsSet();
            Date expiration = claimsSet.getExpirationTime();
            if (expiration == null || expiration.before(new Date())) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Institution token expired");
            }

            Long institutionId = parseInstitutionId(claimsSet.getSubject());
            String email = readString(claimsSet.getClaim("email"));
            String role = RoleMapper.normalize(readString(claimsSet.getClaim("role")));
            String name = readString(claimsSet.getClaim("name"));
            String code = readString(claimsSet.getClaim("code"));
            boolean passwordResetRequired = readBoolean(claimsSet.getClaim("passwordResetRequired"));

            return new InstitutionAuthenticatedUser(
                    institutionId,
                    email,
                    role,
                    name,
                    code,
                    passwordResetRequired
            );
        } catch (ResponseStatusException ex) {
            throw ex;
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid institution token");
        }
    }

    private Long parseInstitutionId(String subject) {
        try {
            return Long.parseLong(subject);
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid institution token subject");
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
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "INSTITUTION_JWT_SECRET is not configured");
        }

        try {
            return MessageDigest.getInstance("SHA-256")
                    .digest(trimmed.getBytes(StandardCharsets.UTF_8));
        } catch (Exception ex) {
            throw new ResponseStatusException(HttpStatus.INTERNAL_SERVER_ERROR,
                    "Unable to initialize institution token secret");
        }
    }
}