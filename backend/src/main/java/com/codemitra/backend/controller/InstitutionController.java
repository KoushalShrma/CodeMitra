package com.codemitra.backend.controller;

import com.codemitra.backend.dto.InstitutionDtos;
import com.codemitra.backend.service.InstitutionAccessService;
import com.codemitra.backend.service.InstitutionService;
import java.util.Map;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Institution administration and test-taking endpoints following the platform's organization API contract.
 */
@RestController
@RequestMapping("/api")
public class InstitutionController {

    private final InstitutionService institutionService;
    private final InstitutionAccessService institutionAccessService;

    public InstitutionController(
            InstitutionService institutionService,
            InstitutionAccessService institutionAccessService
    ) {
        this.institutionService = institutionService;
        this.institutionAccessService = institutionAccessService;
    }

    /**
     * POST /api/institution/register submits one institution onboarding request.
     */
    @PostMapping("/institution/register")
    public Map<String, Object> submitInstitutionRequest(
            @RequestBody InstitutionDtos.SubmitInstitutionRequest request
    ) {
        return institutionAccessService.submitInstitutionRequest(request);
    }

    /**
     * GET /api/institution/discover lists active institutions for student join flow.
     */
    @GetMapping("/institution/discover")
    public Map<String, Object> listDiscoverableInstitutions() {
        return institutionAccessService.listDiscoverableInstitutions();
    }

    /**
     * POST /api/institution/join submits membership request for current student.
     */
    @PostMapping("/institution/join")
    public Map<String, Object> submitJoinRequest(
            @RequestBody InstitutionDtos.SubmitInstitutionJoinRequest request
    ) {
        return institutionAccessService.submitJoinRequest(request);
    }

    /**
     * GET /api/institution/:id/join-requests returns pending membership requests.
     */
    @GetMapping("/institution/{id}/join-requests")
    public Map<String, Object> getInstitutionJoinRequests(@PathVariable("id") Long institutionId) {
        return institutionAccessService.listJoinRequests(institutionId);
    }

    /**
     * GET /api/institution/:id/members returns institution membership list.
     */
    @GetMapping("/institution/{id}/members")
    public Map<String, Object> getInstitutionMembers(@PathVariable("id") Long institutionId) {
        return institutionAccessService.listInstitutionMembers(institutionId);
    }

    /**
     * POST /api/institution/:id/join-requests/:requestId/approve approves one member request.
     */
    @PostMapping("/institution/{id}/join-requests/{requestId}/approve")
    public Map<String, Object> approveJoinRequest(
            @PathVariable("id") Long institutionId,
            @PathVariable("requestId") Long requestId,
            @RequestBody(required = false) InstitutionDtos.ReviewInstitutionJoinRequest request
    ) {
        return institutionAccessService.approveJoinRequest(institutionId, requestId, request);
    }

    /**
     * POST /api/institution/:id/join-requests/:requestId/reject rejects one member request.
     */
    @PostMapping("/institution/{id}/join-requests/{requestId}/reject")
    public Map<String, Object> rejectJoinRequest(
            @PathVariable("id") Long institutionId,
            @PathVariable("requestId") Long requestId,
            @RequestBody(required = false) InstitutionDtos.ReviewInstitutionJoinRequest request
    ) {
        return institutionAccessService.rejectJoinRequest(institutionId, requestId, request);
    }

    /**
     * DELETE /api/institution/:id/members/:membershipId deregisters one institution member.
     */
    @DeleteMapping("/institution/{id}/members/{membershipId}")
    public Map<String, Object> deregisterInstitutionMember(
            @PathVariable("id") Long institutionId,
            @PathVariable("membershipId") Long membershipId
    ) {
        return institutionAccessService.deregisterInstitutionMember(institutionId, membershipId);
    }

    /**
     * POST /api/institution/create creates one institution organization.
     */
    @PostMapping("/institution/create")
    public Map<String, Object> createInstitution(@RequestBody InstitutionDtos.CreateInstitutionRequest request) {
        return institutionService.createInstitution(request);
    }

    /**
     * GET /api/institution/:id fetches institution profile and membership counts.
     */
    @GetMapping("/institution/{id}")
    public Map<String, Object> getInstitution(@PathVariable("id") Long institutionId) {
        return institutionService.getInstitution(institutionId);
    }

    /**
     * POST /api/institution/:id/test/create creates one institution test.
     */
    @PostMapping("/institution/{id}/test/create")
    public Map<String, Object> createInstitutionTest(
            @PathVariable("id") Long institutionId,
            @RequestBody InstitutionDtos.UpsertInstitutionTestRequest request
    ) {
        return institutionService.createInstitutionTest(institutionId, request);
    }

    /**
     * GET /api/institution/:id/tests lists tests for one institution.
     */
    @GetMapping("/institution/{id}/tests")
    public Map<String, Object> getInstitutionTests(@PathVariable("id") Long institutionId) {
        return institutionService.getInstitutionTests(institutionId);
    }

    /**
     * GET /api/institution/:id/test/:testId returns one full test payload.
     */
    @GetMapping("/institution/{id}/test/{testId}")
    public Map<String, Object> getInstitutionTest(
            @PathVariable("id") Long institutionId,
            @PathVariable("testId") Long testId
    ) {
        return institutionService.getInstitutionTest(institutionId, testId);
    }

    /**
     * PUT /api/institution/:id/test/:testId updates mutable test settings.
     */
    @PutMapping("/institution/{id}/test/{testId}")
    public Map<String, Object> updateInstitutionTest(
            @PathVariable("id") Long institutionId,
            @PathVariable("testId") Long testId,
            @RequestBody InstitutionDtos.UpsertInstitutionTestRequest request
    ) {
        return institutionService.updateInstitutionTest(institutionId, testId, request);
    }

    /**
     * POST /api/institution/:id/problem/create creates custom institution problem.
     */
    @PostMapping("/institution/{id}/problem/create")
    public Map<String, Object> createInstitutionProblem(
            @PathVariable("id") Long institutionId,
            @RequestBody InstitutionDtos.CreateCustomProblemRequest request
    ) {
        return institutionService.createInstitutionProblem(institutionId, request);
    }

    /**
     * GET /api/institution/:id/problems lists custom institution problem bank.
     */
    @GetMapping("/institution/{id}/problems")
    public Map<String, Object> getInstitutionProblems(@PathVariable("id") Long institutionId) {
        return institutionService.getInstitutionProblems(institutionId);
    }

    /**
     * GET /api/institution/:id/test/:testId/results returns aggregated candidate result analytics.
     */
    @GetMapping("/institution/{id}/test/{testId}/results")
    public Map<String, Object> getInstitutionTestResults(
            @PathVariable("id") Long institutionId,
            @PathVariable("testId") Long testId
    ) {
        return institutionService.getInstitutionTestResults(institutionId, testId);
    }

    /**
     * GET /api/institution/:id/test/:testId/results/export returns CSV export payload.
     */
    @GetMapping("/institution/{id}/test/{testId}/results/export")
    public ResponseEntity<String> exportInstitutionTestResults(
            @PathVariable("id") Long institutionId,
            @PathVariable("testId") Long testId
    ) {
        String csv = institutionService.exportInstitutionTestResultsCsv(institutionId, testId);
        return ResponseEntity.ok()
                .contentType(MediaType.TEXT_PLAIN)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=test-" + testId + "-results.csv")
                .body(csv);
    }

    /**
     * POST /api/test/:testId/join starts candidate attempt.
     */
    @PostMapping("/test/{testId}/join")
    public Map<String, Object> joinTest(
            @PathVariable("testId") Long testId,
            @RequestBody(required = false) InstitutionDtos.JoinTestRequest request
    ) {
        return institutionService.joinTest(testId, request);
    }

    /**
     * POST /api/test/:testId/submit finalizes candidate attempt.
     */
    @PostMapping("/test/{testId}/submit")
    public Map<String, Object> submitTest(
            @PathVariable("testId") Long testId,
            @RequestBody InstitutionDtos.SubmitTestRequest request
    ) {
        return institutionService.submitTest(testId, request);
    }

    /**
     * GET /api/test/:testId/attempt/:attemptId returns current attempt state.
     */
    @GetMapping("/test/{testId}/attempt/{attemptId}")
    public Map<String, Object> getTestAttempt(
            @PathVariable("testId") Long testId,
            @PathVariable("attemptId") Long attemptId
    ) {
        return institutionService.getTestAttempt(testId, attemptId);
    }

    /**
     * POST /api/test/:testId/proctoring-event stores proctoring telemetry event.
     */
    @PostMapping("/test/{testId}/proctoring-event")
    public Map<String, Object> trackProctoringEvent(
            @PathVariable("testId") Long testId,
            @RequestBody InstitutionDtos.ProctoringEventRequest request
    ) {
        return institutionService.trackProctoringEvent(testId, request);
    }
}
