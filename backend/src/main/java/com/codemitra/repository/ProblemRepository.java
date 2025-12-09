package com.codemitra.repository;

import com.codemitra.model.Difficulty;
import com.codemitra.model.Problem;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProblemRepository extends JpaRepository<Problem, Long> {
    
    Optional<Problem> findBySlug(String slug);
    
    boolean existsBySlug(String slug);
    
    Page<Problem> findByDifficulty(Difficulty difficulty, Pageable pageable);
    
    Page<Problem> findByPatternTag(String patternTag, Pageable pageable);
    
    Page<Problem> findByDifficultyAndPatternTag(Difficulty difficulty, String patternTag, Pageable pageable);
    
    @Query("SELECT DISTINCT p.patternTag FROM Problem p ORDER BY p.patternTag")
    List<String> findAllPatternTags();
    
    @Query("SELECT p FROM Problem p WHERE " +
           "(:difficulty IS NULL OR p.difficulty = :difficulty) AND " +
           "(:patternTag IS NULL OR p.patternTag = :patternTag) AND " +
           "(:search IS NULL OR LOWER(p.title) LIKE LOWER(CONCAT('%', :search, '%')))")
    Page<Problem> findByFilters(
            @Param("difficulty") Difficulty difficulty,
            @Param("patternTag") String patternTag,
            @Param("search") String search,
            Pageable pageable
    );
}
