package com.codemitra.repository;

import com.codemitra.model.Hint;
import com.codemitra.model.StageType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface HintRepository extends JpaRepository<Hint, Long> {
    
    List<Hint> findByUserIdAndProblemId(Long userId, Long problemId);
    
    List<Hint> findByUserIdAndProblemIdAndStageType(Long userId, Long problemId, StageType stageType);
    
    @Query("SELECT COUNT(h) FROM Hint h WHERE h.user.id = :userId AND h.problem.id = :problemId AND h.stageType = :stageType")
    int countByUserIdAndProblemIdAndStageType(
            @Param("userId") Long userId,
            @Param("problemId") Long problemId,
            @Param("stageType") StageType stageType
    );
}
