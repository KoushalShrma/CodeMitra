package com.codemitra.service;

import com.codemitra.dto.*;
import com.codemitra.model.*;
import com.codemitra.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProblemService {
    
    private final ProblemRepository problemRepository;
    private final ProblemStageRepository problemStageRepository;
    private final UserProgressRepository userProgressRepository;
    
    public Page<ProblemListDTO> getProblems(Difficulty difficulty, String patternTag, String search, Long userId, Pageable pageable) {
        Page<Problem> problems = problemRepository.findByFilters(difficulty, patternTag, search, pageable);
        
        return problems.map(problem -> {
            ProblemListDTO.UserProgressSummary progress = null;
            
            if (userId != null) {
                Optional<UserProgress> userProgress = userProgressRepository.findByUserIdAndProblemId(userId, problem.getId());
                if (userProgress.isPresent()) {
                    UserProgress up = userProgress.get();
                    progress = ProblemListDTO.UserProgressSummary.builder()
                            .bruteCompleted(up.getBruteCompleted())
                            .improvedCompleted(up.getImprovedCompleted())
                            .optimalCompleted(up.getOptimalCompleted())
                            .build();
                }
            }
            
            return ProblemListDTO.builder()
                    .id(problem.getId())
                    .title(problem.getTitle())
                    .slug(problem.getSlug())
                    .difficulty(problem.getDifficulty())
                    .patternTag(problem.getPatternTag())
                    .progress(progress)
                    .build();
        });
    }
    
    public Optional<ProblemDTO> getProblemById(Long id) {
        return problemRepository.findById(id)
                .map(this::mapToDTO);
    }
    
    public Optional<ProblemDTO> getProblemBySlug(String slug) {
        return problemRepository.findBySlug(slug)
                .map(this::mapToDTO);
    }
    
    public List<String> getAllPatternTags() {
        return problemRepository.findAllPatternTags();
    }
    
    @Transactional
    public ProblemDTO createProblem(CreateProblemRequest request, User createdBy) {
        String slug = generateSlug(request.getTitle());
        
        Problem problem = Problem.builder()
                .title(request.getTitle())
                .slug(slug)
                .description(request.getDescription())
                .difficulty(request.getDifficulty())
                .patternTag(request.getPatternTag())
                .constraintsText(request.getConstraintsText())
                .sampleInput(request.getSampleInput())
                .sampleOutput(request.getSampleOutput())
                .hiddenTestCases(request.getHiddenTestCases())
                .createdBy(createdBy)
                .build();
        
        problem = problemRepository.save(problem);
        
        // Create stages
        if (request.getStages() != null && !request.getStages().isEmpty()) {
            for (CreateProblemRequest.CreateProblemStageRequest stageRequest : request.getStages()) {
                ProblemStage stage = ProblemStage.builder()
                        .problem(problem)
                        .stageType(stageRequest.getStageType())
                        .recommendedApproachText(stageRequest.getRecommendedApproachText())
                        .expectedTimeComplexity(stageRequest.getExpectedTimeComplexity())
                        .expectedSpaceComplexity(stageRequest.getExpectedSpaceComplexity())
                        .minAttemptsBeforeHint(stageRequest.getMinAttemptsBeforeHint() != null ? stageRequest.getMinAttemptsBeforeHint() : 2)
                        .minSecondsBeforeHint(stageRequest.getMinSecondsBeforeHint() != null ? stageRequest.getMinSecondsBeforeHint() : 90)
                        .build();
                problemStageRepository.save(stage);
            }
        } else {
            // Create default stages
            for (StageType stageType : StageType.values()) {
                ProblemStage stage = ProblemStage.builder()
                        .problem(problem)
                        .stageType(stageType)
                        .minAttemptsBeforeHint(2)
                        .minSecondsBeforeHint(90)
                        .build();
                problemStageRepository.save(stage);
            }
        }
        
        return getProblemById(problem.getId()).orElseThrow();
    }
    
    private String generateSlug(String title) {
        String baseSlug = title.toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")
                .replaceAll("\\s+", "-")
                .replaceAll("-+", "-")
                .replaceAll("^-|-$", "");
        
        String slug = baseSlug;
        int counter = 1;
        while (problemRepository.existsBySlug(slug)) {
            slug = baseSlug + "-" + counter;
            counter++;
        }
        return slug;
    }
    
    private ProblemDTO mapToDTO(Problem problem) {
        List<ProblemStageDTO> stages = problemStageRepository.findByProblemId(problem.getId())
                .stream()
                .map(stage -> ProblemStageDTO.builder()
                        .id(stage.getId())
                        .stageType(stage.getStageType())
                        .recommendedApproachText(stage.getRecommendedApproachText())
                        .expectedTimeComplexity(stage.getExpectedTimeComplexity())
                        .expectedSpaceComplexity(stage.getExpectedSpaceComplexity())
                        .minAttemptsBeforeHint(stage.getMinAttemptsBeforeHint())
                        .minSecondsBeforeHint(stage.getMinSecondsBeforeHint())
                        .build())
                .collect(Collectors.toList());
        
        return ProblemDTO.builder()
                .id(problem.getId())
                .title(problem.getTitle())
                .slug(problem.getSlug())
                .description(problem.getDescription())
                .difficulty(problem.getDifficulty())
                .patternTag(problem.getPatternTag())
                .constraintsText(problem.getConstraintsText())
                .sampleInput(problem.getSampleInput())
                .sampleOutput(problem.getSampleOutput())
                .stages(stages)
                .createdAt(problem.getCreatedAt())
                .build();
    }
}
