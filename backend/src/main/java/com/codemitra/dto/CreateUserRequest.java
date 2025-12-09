package com.codemitra.dto;

import com.codemitra.model.UserRole;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CreateUserRequest {
    
    @NotBlank(message = "Clerk user ID is required")
    private String clerkUserId;
    
    @NotBlank(message = "Email is required")
    @Email(message = "Invalid email format")
    private String email;
    
    private String name;
    private UserRole role;
    private String branch;
    private Integer yearOfStudy;
    private String college;
    private String preferredLanguage;
    private String profileImageUrl;
}
