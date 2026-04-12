package com.codemitra.backend.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Central security configuration that applies Clerk JWT auth guards to the API.
 */
@Configuration
public class SecurityConfig {

    private final AdminJwtFilter adminJwtFilter;
    private final InstitutionJwtFilter institutionJwtFilter;
    private final ClerkJwtFilter clerkJwtFilter;

    public SecurityConfig(
            AdminJwtFilter adminJwtFilter,
            InstitutionJwtFilter institutionJwtFilter,
            ClerkJwtFilter clerkJwtFilter
    ) {
        this.adminJwtFilter = adminJwtFilter;
        this.institutionJwtFilter = institutionJwtFilter;
        this.clerkJwtFilter = clerkJwtFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/", "/uploads/**").permitAll()
                        .requestMatchers("/api/institution/discover").permitAll()
                        .requestMatchers("/api/institution/register").permitAll()
                        .requestMatchers("/api/institution/auth/login").permitAll()
                        .requestMatchers("/api/admin/auth/login").permitAll()
                        .requestMatchers("/api/admin/**").authenticated()
                    .requestMatchers("/api/**").authenticated()
                    .anyRequest().permitAll()
                )
                .addFilterBefore(institutionJwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(clerkJwtFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(adminJwtFilter, ClerkJwtFilter.class)
                .exceptionHandling(ex -> ex.authenticationEntryPoint((request, response, authException) -> {
                    response.setStatus(401);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"message\":\"Unauthorized\"}");
                }));

        return http.build();
    }

    /**
     * Password encoder used for legacy institute/student credential endpoints.
     */
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
