package com.codemitra.backend.config;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.proc.JWSKeySelector;
import com.nimbusds.jose.proc.SecurityContext;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.proc.DefaultJWTProcessor;
import com.nimbusds.jwt.proc.JWTProcessor;
import com.nimbusds.jwt.proc.BadJWTException;
import com.nimbusds.jose.proc.JWSVerificationKeySelector;
import com.nimbusds.jose.jwk.source.JWKSource;
import com.nimbusds.jose.jwk.source.RemoteJWKSet;
import java.net.MalformedURLException;
import java.net.URL;
import java.text.ParseException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

/**
 * Verifies Clerk-issued JWT bearer tokens using Clerk JWKS.
 */
@Component
public class ClerkJwtVerifier {

    private final JWTProcessor<SecurityContext> jwtProcessor;

    public ClerkJwtVerifier(@Value("${clerk.jwks-url}") String jwksUrl) throws MalformedURLException {
        DefaultJWTProcessor<SecurityContext> processor = new DefaultJWTProcessor<>();
        JWKSource<SecurityContext> keySource = new RemoteJWKSet<>(new URL(jwksUrl));
        JWSKeySelector<SecurityContext> keySelector = new JWSVerificationKeySelector<>(JWSAlgorithm.RS256, keySource);
        processor.setJWSKeySelector(keySelector);
        this.jwtProcessor = processor;
    }

    /**
     * Validates signature and token structure, then maps claims to a typed principal.
     */
    public AuthenticatedUser verify(String rawToken) throws ParseException, BadJWTException, java.text.ParseException, com.nimbusds.jose.proc.BadJOSEException, com.nimbusds.jose.JOSEException {
        JWTClaimsSet claimsSet = jwtProcessor.process(rawToken, null);
        Map<String, Object> claims = new HashMap<>(claimsSet.getClaims());
        String subject = claimsSet.getSubject();

        if (subject == null || subject.isBlank()) {
            throw new BadJWTException("Missing subject claim");
        }

        String email = readStringClaim(claims, "email", "email_address");
        String firstName = readStringClaim(claims, "first_name", "firstName");
        String lastName = readStringClaim(claims, "last_name", "lastName");
        String fullName = readStringClaim(claims, "name", "full_name", "fullName");

        if ((fullName == null || fullName.isBlank()) && (firstName != null || lastName != null)) {
            String left = firstName == null ? "" : firstName.trim();
            String right = lastName == null ? "" : lastName.trim();
            fullName = (left + " " + right).trim();
        }

        String role = readStringClaim(claims, "role", "public_metadata.role", "publicMetadata.role");
        if (role == null || role.isBlank()) {
            role = "student";
        }

        String imageUrl = readStringClaim(claims, "image_url", "imageUrl", "picture");

        return new AuthenticatedUser(subject, email, fullName, role, imageUrl, Collections.unmodifiableMap(claims));
    }

    /**
     * Reads both flat and dot-path claims from decoded JWT claims.
     */
    private String readStringClaim(Map<String, Object> claims, String... keys) {
        for (String key : keys) {
            Object value;
            if (key.contains(".")) {
                value = readDotPath(claims, key);
            } else {
                value = claims.get(key);
            }
            if (value instanceof String str && !str.isBlank()) {
                return str;
            }
        }
        return null;
    }

    /**
     * Resolves nested keys like public_metadata.role.
     */
    @SuppressWarnings("unchecked")
    private Object readDotPath(Map<String, Object> claims, String path) {
        String[] parts = path.split("\\.");
        Object current = claims;
        for (String part : parts) {
            if (!(current instanceof Map<?, ?> map)) {
                return null;
            }
            current = ((Map<String, Object>) map).get(part);
            if (current == null) {
                return null;
            }
        }
        return current;
    }
}
