package com.codemitra.backend.controller;

import com.codemitra.backend.dto.InstitutionDtos;
import com.codemitra.backend.service.InstitutionAccessService;
import java.util.Map;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Super admin APIs for reviewing institution onboarding requests.
 */
@RestController
@RequestMapping("/api/admin/institutions")
public class AdminInstitutionController {

    private final InstitutionAccessService institutionAccessService;

    public AdminInstitutionController(InstitutionAccessService institutionAccessService) {
        this.institutionAccessService = institutionAccessService;
    }

    @GetMapping
    public Map<String, Object> listInstitutions(@RequestParam(name = "status", required = false) String status) {
        return institutionAccessService.listInstitutionsForAdmin(status);
    }

    @GetMapping("/requests")
    public Map<String, Object> listRequests(@RequestParam(name = "status", required = false) String status) {
        return institutionAccessService.listInstitutionRequests(status);
    }

    @PostMapping("/requests/{requestId}/approve")
    public Map<String, Object> approveRequest(
            @PathVariable("requestId") Long requestId,
            @RequestBody(required = false) InstitutionDtos.ReviewInstitutionRequest request
    ) {
        return institutionAccessService.approveInstitutionRequest(requestId, request);
    }

    @PostMapping("/requests/{requestId}/reject")
    public Map<String, Object> rejectRequest(
            @PathVariable("requestId") Long requestId,
            @RequestBody(required = false) InstitutionDtos.ReviewInstitutionRequest request
    ) {
        return institutionAccessService.rejectInstitutionRequest(requestId, request);
    }

    @DeleteMapping("/{institutionId}")
    public Map<String, Object> removeInstitution(@PathVariable("institutionId") Long institutionId) {
        return institutionAccessService.removeInstitution(institutionId);
    }
}
