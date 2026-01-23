package com.codemitra.filter;

import com.codemitra.dto.CreateUserRequest;
import com.codemitra.model.User;
import com.codemitra.model.UserRole;
import com.codemitra.service.UserService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.util.*;

@Component
@RequiredArgsConstructor
@Slf4j
public class ClerkAuthenticationFilter extends OncePerRequestFilter {
    
    private final UserService userService;
    private final ObjectMapper objectMapper;
    
    @Value("${clerk.jwks-url}")
    private String jwksUrl;
    
    @Value("${clerk.issuer}")
    private String issuer;
    
    private static final List<String> PUBLIC_PATHS = Arrays.asList(
            "/api/health",
            "/h2-console",
            "/api/problems",
            "/api/patterns"
    );
    
    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        
        String path = request.getRequestURI();
        String method = request.getMethod();
        
        // Skip filter for public endpoints
        if (isPublicPath(path, method)) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String authHeader = request.getHeader("Authorization");
        
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }
        
        String token = authHeader.substring(7);
        
        try {
            // Decode JWT (simplified - in production, verify signature with JWKS)
            Map<String, Object> claims = decodeJwt(token);
            
            if (claims != null) {
                String clerkUserId = (String) claims.get("sub");
                String email = (String) claims.get("email");
                String name = extractName(claims);
                String imageUrl = (String) claims.get("image_url");
                
                // Get or create user
                User user;
                try {
                    user = userService.getUserEntityByClerkId(clerkUserId);
                } catch (Exception e) {
                    // Create new user if not exists
                    CreateUserRequest createRequest = CreateUserRequest.builder()
                            .clerkUserId(clerkUserId)
                            .email(email != null ? email : clerkUserId + "@codemitra.app")
                            .name(name)
                            .profileImageUrl(imageUrl)
                            .role(UserRole.STUDENT)
                            .build();
                    userService.createOrUpdateUser(createRequest);
                    user = userService.getUserEntityByClerkId(clerkUserId);
                }
                
                // Create authentication token
                List<SimpleGrantedAuthority> authorities = Collections.singletonList(
                        new SimpleGrantedAuthority("ROLE_" + user.getRole().name())
                );
                
                UsernamePasswordAuthenticationToken authentication = 
                        new UsernamePasswordAuthenticationToken(user, null, authorities);
                
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            log.error("Error processing JWT: {}", e.getMessage());
        }
        
        filterChain.doFilter(request, response);
    }
    
    private boolean isPublicPath(String path, String method) {
        // Allow OPTIONS for CORS
        if ("OPTIONS".equalsIgnoreCase(method)) {
            return true;
        }
        
        // Check for public GET endpoints
        if ("GET".equalsIgnoreCase(method)) {
            for (String publicPath : PUBLIC_PATHS) {
                if (path.startsWith(publicPath)) {
                    return true;
                }
            }
        }
        
        // Allow POST to /api/users for user creation
        if ("POST".equalsIgnoreCase(method) && path.equals("/api/users")) {
            return true;
        }
        
        return path.startsWith("/h2-console");
    }
    
    private Map<String, Object> decodeJwt(String token) {
        // NOTE: This is a simplified JWT decode for development purposes.
        // In production, implement proper JWT signature validation using JWKS:
        // 1. Fetch JWKS from Clerk's /.well-known/jwks.json endpoint
        // 2. Use a library like java-jwt or jjwt to validate the signature
        // 3. Verify issuer, audience, and expiration claims
        try {
            String[] parts = token.split("\\.");
            if (parts.length != 3) {
                return null;
            }
            
            String payload = new String(Base64.getUrlDecoder().decode(parts[1]));
            return objectMapper.readValue(payload, Map.class);
        } catch (Exception e) {
            log.error("Error decoding JWT: {}", e.getMessage());
            return null;
        }
    }
    
    private String extractName(Map<String, Object> claims) {
        if (claims.containsKey("name")) {
            return (String) claims.get("name");
        }
        
        String firstName = (String) claims.get("first_name");
        String lastName = (String) claims.get("last_name");
        
        if (firstName != null || lastName != null) {
            return ((firstName != null ? firstName : "") + " " + (lastName != null ? lastName : "")).trim();
        }
        
        return null;
    }
}
