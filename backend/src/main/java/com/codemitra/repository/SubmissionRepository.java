package com.codemitra.repository;

import com.codemitra.model.StageType;
import com.codemitra.model.Submission;
import com.codemitra.model.SubmissionStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface SubmissionRepository extends JpaRepository<Submission, Long> {
    
    Page<Submission> findByUserId(Long userId, Pageable pageable);
    
    Page<Submission> findByUserIdAndProblemId(Long userId, Long problemId, Pageable pageable);
    
    List<Submission> findByUserIdAndProblemIdAndStageType(Long userId, Long problemId, StageType stageType);
    
    @Query("SELECT COUNT(s) FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId AND s.stageType = :stageType")
    int countByUserIdAndProblemIdAndStageType(
            @Param("userId") Long userId,
            @Param("problemId") Long problemId,
            @Param("stageType") StageType stageType
    );
    
    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId AND s.stageType = :stageType AND s.status = :status ORDER BY s.createdAt DESC")
    List<Submission> findLatestPassedSubmission(
            @Param("userId") Long userId,
            @Param("problemId") Long problemId,
            @Param("stageType") StageType stageType,
            @Param("status") SubmissionStatus status,
            Pageable pageable
    );
    
    List<Submission> findByTestIdAndUserId(Long testId, Long userId);
    
    @Query("SELECT s FROM Submission s WHERE s.user.id = :userId ORDER BY s.createdAt DESC")
    Page<Submission> findRecentSubmissions(@Param("userId") Long userId, Pageable pageable);
    
    @Query("SELECT COUNT(DISTINCT s.problem.id) FROM Submission s WHERE s.user.id = :userId AND s.status = 'PASSED'")
    int countDistinctProblemsSolved(@Param("userId") Long userId);
    
    @Query("SELECT s.createdAt FROM Submission s WHERE s.user.id = :userId AND s.problem.id = :problemId AND s.stageType = :stageType ORDER BY s.createdAt ASC")
    List<LocalDateTime> findFirstAttemptTime(
            @Param("userId") Long userId,
            @Param("problemId") Long problemId,
            @Param("stageType") StageType stageType,
            Pageable pageable
    );
}
