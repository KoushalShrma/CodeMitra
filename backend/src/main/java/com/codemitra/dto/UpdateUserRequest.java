package com.codemitra.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateUserRequest {
    private String name;
    private String branch;
    private Integer yearOfStudy;
    private String college;
    private String preferredLanguage;
    private String profileImageUrl;
}
