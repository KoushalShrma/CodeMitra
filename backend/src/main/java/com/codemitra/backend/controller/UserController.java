package com.codemitra.backend.controller;

import com.codemitra.backend.service.UserService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.bind.annotation.RequestParam;

/**
 * User profile and progress endpoints mirroring the original Express routes.
 */
@RestController
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    /**
     * GET /user/:id returns profile by id or "me" alias.
     */
    @GetMapping("/user/{id}")
    public Map<String, Object> getUserById(@PathVariable("id") String id) {
        return userService.getUserById(id);
    }

    /**
     * GET /api/user/progress/:userId returns analytics by id or "me" alias.
     */
    @GetMapping("/api/user/progress/{userId}")
    public Map<String, Object> getUserProgress(@PathVariable("userId") String userId) {
        return userService.getUserProgress(userId);
    }

    /**
     * PUT /user/:id updates mutable profile fields.
     */
    @PutMapping("/user/{id}")
    public Map<String, Object> updateUserById(
            @PathVariable("id") String id,
            @RequestBody Map<String, Object> payload
    ) {
        return userService.updateUserById(id, payload);
    }

    /**
     * POST /upload-profile-image stores image and returns URL path.
     */
    @PostMapping("/upload-profile-image")
    public Map<String, Object> uploadProfileImage(@RequestParam("profileImage") MultipartFile profileImage) {
        return userService.uploadProfileImage(profileImage);
    }

    /**
     * Additional convenience endpoint for frontend to fetch current user profile directly.
     */
    @GetMapping("/user/me")
    public Map<String, Object> getCurrentUser() {
        return userService.getUserById("me");
    }
}
