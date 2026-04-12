package com.codemitra.backend.dto;

/**
 * DTOs for Judge0 execution APIs.
 */
public final class ExecutionDtos {

    private ExecutionDtos() {
    }

    /**
         * Payload for running source code against Judge0.
     */
    public record ExecuteRequest(
            Integer languageId,
            String language,
            String code,
            String stdin
    ) {
    }
}
