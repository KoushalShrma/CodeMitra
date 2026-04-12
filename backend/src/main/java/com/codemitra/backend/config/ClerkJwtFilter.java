package com.codemitra.backend.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

/**
 * Verifies Clerk bearer JWTs for API routes and propagates identity into Spring Security context.
 */
@Component
public class ClerkJwtFilter extends OncePerRequestFilter {

    private final ClerkJwtVerifier clerkJwtVerifier;

    public ClerkJwtFilter(ClerkJwtVerifier clerkJwtVerifier) {
        this.clerkJwtVerifier = clerkJwtVerifier;
    }

    /**
     * Applies this filter only for /api/** endpoints so static/public routes remain unaffected.
     */
    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return !path.startsWith("/api/")
            || path.startsWith("/api/admin/")
            || path.startsWith("/api/institution/auth/")
            || path.startsWith("/api/institution/register")
            || "OPTIONS".equalsIgnoreCase(request.getMethod());
    }

    /**
     * Parses bearer token, verifies Clerk JWT, and attaches verified user principal to security context.
     */
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        if (SecurityContextHolder.getContext().getAuthentication() != null) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = extractBearerToken(request);
        if (token == null || token.isBlank()) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            AuthenticatedUser principal = clerkJwtVerifier.verify(token);
            applyAuthentication(request, principal);
            filterChain.doFilter(request, response);
        } catch (Exception ex) {
            SecurityContextHolder.clearContext();
            filterChain.doFilter(request, response);
        }
    }

    /**
     * Extracts bearer token from Authorization header if present and correctly formatted.
     */
    private String extractBearerToken(HttpServletRequest request) {
        String authHeader = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return null;
        }
        return authHeader.substring(7);
    }

    /**
     * Converts verified Clerk claims into Spring Authentication and stores it in security context.
     */
    private void applyAuthentication(HttpServletRequest request, AuthenticatedUser principal) {
        String role = RoleMapper.normalize(principal.role());

        UsernamePasswordAuthenticationToken authentication = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + role))
        );
        authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
        SecurityContextHolder.getContext().setAuthentication(authentication);
    }

}
