package com.codemitra.repository;

import com.codemitra.model.UserStats;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserStatsRepository extends JpaRepository<UserStats, Long> {
    
    Optional<UserStats> findByUserId(Long userId);
}
