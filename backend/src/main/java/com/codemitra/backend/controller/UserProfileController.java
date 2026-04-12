package com.codemitra.backend.controller;

import com.codemitra.backend.service.UserProfileService;
import java.util.Map;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Current-user profile API for durable profile/session preference persistence.
 */
@RestController
@RequestMapping("/api/users/me/profile")
public class UserProfileController {

    private final UserProfileService userProfileService;

    public UserProfileController(UserProfileService userProfileService) {
        this.userProfileService = userProfileService;
    }

    /**
     * Returns merged identity, preference, and stats payload for current user.
     */
    @GetMapping
    public Map<String, Object> getCurrentProfile() {
        return userProfileService.getCurrentProfile();
    }

    /**
     * Partially updates current profile fields and persisted preferences.
     */
    @PutMapping
    public Map<String, Object> updateCurrentProfile(@RequestBody(required = false) Map<String, Object> payload) {
        return userProfileService.updateCurrentProfile(payload);
    }

    /**
     * Re-syncs local profile from current Clerk principal claims.
     */
    @PostMapping("/sync-clerk")
    public Map<String, Object> syncCurrentProfileFromClerk() {
        return userProfileService.syncCurrentProfileFromClerk();
    }
}
