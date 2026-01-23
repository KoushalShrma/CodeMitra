package com.codemitra.repository;

import com.codemitra.model.Test;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TestRepository extends JpaRepository<Test, Long> {
    
    List<Test> findByCreatedById(Long createdById);
    
    Page<Test> findByCreatedById(Long createdById, Pageable pageable);
    
    @Query("SELECT t FROM Test t WHERE t.isActive = true AND t.startTime <= :now AND t.endTime >= :now")
    List<Test> findActiveTests(@Param("now") LocalDateTime now);
    
    @Query("SELECT t FROM Test t WHERE t.isActive = true AND t.startTime > :now ORDER BY t.startTime ASC")
    List<Test> findUpcomingTests(@Param("now") LocalDateTime now);
    
    @Query("SELECT t FROM Test t WHERE t.isActive = true AND t.endTime < :now ORDER BY t.endTime DESC")
    Page<Test> findPastTests(@Param("now") LocalDateTime now, Pageable pageable);
}
