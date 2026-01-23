package com.codemitra.dto;

import com.codemitra.model.UserRole;
import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserDTO {
    private Long id;
    private String clerkUserId;
    private String email;
    private String name;
    private UserRole role;
    private String branch;
    private Integer yearOfStudy;
    private String college;
    private String preferredLanguage;
    private String profileImageUrl;
    private LocalDateTime createdAt;
}
