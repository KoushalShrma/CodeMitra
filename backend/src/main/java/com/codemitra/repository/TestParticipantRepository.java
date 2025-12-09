package com.codemitra.repository;

import com.codemitra.model.TestParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface TestParticipantRepository extends JpaRepository<TestParticipant, Long> {
    
    Optional<TestParticipant> findByTestIdAndUserId(Long testId, Long userId);
    
    List<TestParticipant> findByTestId(Long testId);
    
    List<TestParticipant> findByUserId(Long userId);
    
    @Query("SELECT AVG(tp.totalScore) FROM TestParticipant tp WHERE tp.test.id = :testId AND tp.status = 'COMPLETED'")
    Double findAverageScoreByTestId(@Param("testId") Long testId);
    
    @Query("SELECT COUNT(tp) FROM TestParticipant tp WHERE tp.test.id = :testId AND tp.status = :status")
    int countByTestIdAndStatus(@Param("testId") Long testId, @Param("status") String status);
}
