package com.codemitra.dto;

import lombok.*;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class HintResponse {
    private Long hintId;
    private String hintText;
    private LocalDateTime createdAt;
    private int totalHintsUsed;
}
