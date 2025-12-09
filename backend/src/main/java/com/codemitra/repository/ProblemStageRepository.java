package com.codemitra.repository;

import com.codemitra.model.ProblemStage;
import com.codemitra.model.StageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemStageRepository extends JpaRepository<ProblemStage, Long> {
    
    List<ProblemStage> findByProblemId(Long problemId);
    
    Optional<ProblemStage> findByProblemIdAndStageType(Long problemId, StageType stageType);
}
