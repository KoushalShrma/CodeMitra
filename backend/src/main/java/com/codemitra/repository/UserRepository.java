package com.codemitra.repository;

import com.codemitra.model.User;
import com.codemitra.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByClerkUserId(String clerkUserId);
    
    Optional<User> findByEmail(String email);
    
    boolean existsByClerkUserId(String clerkUserId);
    
    boolean existsByEmail(String email);
    
    List<User> findByRole(UserRole role);
    
    List<User> findByCollegeAndRole(String college, UserRole role);
}
