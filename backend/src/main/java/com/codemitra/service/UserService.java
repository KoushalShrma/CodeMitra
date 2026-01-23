package com.codemitra.service;

import com.codemitra.dto.*;
import com.codemitra.model.*;
import com.codemitra.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    
    private final UserRepository userRepository;
    private final UserStatsRepository userStatsRepository;
    
    @Transactional
    public UserDTO createOrUpdateUser(CreateUserRequest request) {
        Optional<User> existingUser = userRepository.findByClerkUserId(request.getClerkUserId());
        
        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            user.setEmail(request.getEmail());
            if (request.getName() != null) user.setName(request.getName());
            if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        } else {
            user = User.builder()
                    .clerkUserId(request.getClerkUserId())
                    .email(request.getEmail())
                    .name(request.getName())
                    .role(request.getRole() != null ? request.getRole() : UserRole.STUDENT)
                    .branch(request.getBranch())
                    .yearOfStudy(request.getYearOfStudy())
                    .college(request.getCollege())
                    .preferredLanguage(request.getPreferredLanguage() != null ? request.getPreferredLanguage() : "PYTHON")
                    .profileImageUrl(request.getProfileImageUrl())
                    .build();
            
            user = userRepository.save(user);
            
            // Create initial user stats
            UserStats stats = UserStats.builder()
                    .user(user)
                    .build();
            userStatsRepository.save(stats);
        }
        
        return mapToDTO(userRepository.save(user));
    }
    
    public Optional<UserDTO> getUserByClerkId(String clerkUserId) {
        return userRepository.findByClerkUserId(clerkUserId)
                .map(this::mapToDTO);
    }
    
    public Optional<UserDTO> getUserById(Long id) {
        return userRepository.findById(id)
                .map(this::mapToDTO);
    }
    
    @Transactional
    public Optional<UserDTO> updateUser(String clerkUserId, UpdateUserRequest request) {
        return userRepository.findByClerkUserId(clerkUserId)
                .map(user -> {
                    if (request.getName() != null) user.setName(request.getName());
                    if (request.getBranch() != null) user.setBranch(request.getBranch());
                    if (request.getYearOfStudy() != null) user.setYearOfStudy(request.getYearOfStudy());
                    if (request.getCollege() != null) user.setCollege(request.getCollege());
                    if (request.getPreferredLanguage() != null) user.setPreferredLanguage(request.getPreferredLanguage());
                    if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
                    return mapToDTO(userRepository.save(user));
                });
    }
    
    public User getUserEntityByClerkId(String clerkUserId) {
        return userRepository.findByClerkUserId(clerkUserId)
                .orElseThrow(() -> new RuntimeException("User not found with clerk ID: " + clerkUserId));
    }
    
    private UserDTO mapToDTO(User user) {
        return UserDTO.builder()
                .id(user.getId())
                .clerkUserId(user.getClerkUserId())
                .email(user.getEmail())
                .name(user.getName())
                .role(user.getRole())
                .branch(user.getBranch())
                .yearOfStudy(user.getYearOfStudy())
                .college(user.getCollege())
                .preferredLanguage(user.getPreferredLanguage())
                .profileImageUrl(user.getProfileImageUrl())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
