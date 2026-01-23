package com.codemitra.repository;

import com.codemitra.model.UserProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserProgressRepository extends JpaRepository<UserProgress, Long> {
    
    Optional<UserProgress> findByUserIdAndProblemId(Long userId, Long problemId);
    
    List<UserProgress> findByUserId(Long userId);
    
    @Query("SELECT COUNT(up) FROM UserProgress up WHERE up.user.id = :userId AND up.optimalCompleted = true")
    int countFullyCompletedProblems(@Param("userId") Long userId);
    
    @Query("SELECT up.problem.patternTag, COUNT(up) FROM UserProgress up WHERE up.user.id = :userId AND up.optimalCompleted = true GROUP BY up.problem.patternTag")
    List<Object[]> countCompletedByPattern(@Param("userId") Long userId);
}
