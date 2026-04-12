package com.codemitra.backend.service;

import com.codemitra.backend.config.AuthenticatedUser;
import com.codemitra.backend.model.PerformanceEntity;
import com.codemitra.backend.model.UserAnalyticsEntity;
import com.codemitra.backend.model.UserEntity;
import com.codemitra.backend.model.UserProfileEntity;
import com.codemitra.backend.repository.PerformanceRepository;
import com.codemitra.backend.repository.UserAnalyticsRepository;
import com.codemitra.backend.repository.UserProfileRepository;
import com.codemitra.backend.repository.UserRepository;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

/**
 * Provides a single persistent profile surface for authenticated users.
 */
@Service
public class UserProfileService {

    private static final Set<String> ALLOWED_THEMES = Set.of("dark", "light");
    private static final Set<String> ALLOWED_LANGUAGES = Set.of("javascript", "python", "java", "cpp");

    private final AuthService authService;
    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final PerformanceRepository performanceRepository;
    private final UserAnalyticsRepository userAnalyticsRepository;

    public UserProfileService(
            AuthService authService,
            UserRepository userRepository,
            UserProfileRepository userProfileRepository,
            PerformanceRepository performanceRepository,
            UserAnalyticsRepository userAnalyticsRepository
    ) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.userProfileRepository = userProfileRepository;
        this.performanceRepository = performanceRepository;
        this.userAnalyticsRepository = userAnalyticsRepository;
    }

    /**
     * Returns current authenticated profile and persisted preferences.
     */
    @Transactional
    public Map<String, Object> getCurrentProfile() {
        UserEntity user = authService.getOrCreateCurrentUser();
        UserProfileEntity profile = getOrCreateProfile(user.getId());
        return withMessage("Profile fetched", buildPayload(user, profile));
    }

    /**
     * Syncs Clerk principal fields to local user row and returns merged profile payload.
     */
    @Transactional
    public Map<String, Object> syncCurrentProfileFromClerk() {
        UserEntity user = authService.getOrCreateCurrentUser();
        UserProfileEntity profile = getOrCreateProfile(user.getId());

        AuthenticatedUser principal = authService.currentPrincipal();
        boolean profileChanged = false;

        String locale = readStringClaim(principal.claims(), "locale", "locale_code");
        if ((profile.getLocale() == null || profile.getLocale().isBlank()) && locale != null && !locale.isBlank()) {
            profile.setLocale(locale.trim());
            profileChanged = true;
        }

        String timezone = readStringClaim(principal.claims(), "timezone", "tz");
        if ((profile.getTimezone() == null || profile.getTimezone().isBlank())
                && timezone != null && !timezone.isBlank()) {
            profile.setTimezone(timezone.trim());
            profileChanged = true;
        }

        if (profileChanged) {
            profile = userProfileRepository.save(profile);
        }

        return withMessage("Profile synced", buildPayload(user, profile));
    }

    /**
     * Updates mutable identity fields and preference settings for current user.
     */
    @Transactional
    public Map<String, Object> updateCurrentProfile(Map<String, Object> payload) {
        UserEntity user = authService.getOrCreateCurrentUser();
        UserProfileEntity profile = getOrCreateProfile(user.getId());

        Map<String, Object> safePayload = payload == null ? Collections.emptyMap() : payload;
        Map<String, Object> preferencesPayload = toStringKeyMap(safePayload.get("preferences"));

        boolean userChanged = false;
        boolean profileChanged = false;

        if (safePayload.containsKey("name")) {
            String name = trimmedString(safePayload.get("name"));
            if (name == null || name.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "name cannot be empty");
            }
            if (!name.equals(user.getName())) {
                user.setName(name);
                userChanged = true;
            }
        }

        if (safePayload.containsKey("email")) {
            String email = trimmedString(safePayload.get("email"));
            if (email == null || email.isBlank()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "email cannot be empty");
            }
            String normalizedEmail = email.toLowerCase(Locale.ROOT);
            if (!normalizedEmail.equalsIgnoreCase(user.getEmail())) {
                Optional<UserEntity> conflict = userRepository.findByEmailIgnoreCase(normalizedEmail);
                if (conflict.isPresent() && !conflict.get().getId().equals(user.getId())) {
                    throw new ResponseStatusException(HttpStatus.CONFLICT, "User with this email already exists");
                }
                user.setEmail(normalizedEmail);
                userChanged = true;
            }
        }

        if (safePayload.containsKey("bio")) {
            String bio = nullableTrimmed(safePayload.get("bio"));
            if (!safeEquals(bio, user.getBio())) {
                user.setBio(bio);
                userChanged = true;
            }
        }

        if (safePayload.containsKey("profile_image")) {
            String profileImage = nullableTrimmed(safePayload.get("profile_image"));
            if (!safeEquals(profileImage, user.getProfileImage())) {
                user.setProfileImage(profileImage);
                userChanged = true;
            }
        }

        Object themeRaw = preferenceValue(safePayload, preferencesPayload, "theme_mode");
        if (themeRaw != null) {
            String theme = normalizeTheme(themeRaw);
            if (!theme.equals(profile.getThemeMode())) {
                profile.setThemeMode(theme);
                profileChanged = true;
            }
        }

        Object fontRaw = preferenceValue(safePayload, preferencesPayload, "editor_font_size");
        if (fontRaw != null) {
            int fontSize = clamp(toInteger(fontRaw, "editor_font_size"), 12, 22);
            if (!Integer.valueOf(fontSize).equals(profile.getEditorFontSize())) {
                profile.setEditorFontSize(fontSize);
                profileChanged = true;
            }
        }

        Object sidebarRaw = preferenceValue(safePayload, preferencesPayload, "sidebar_collapsed");
        if (sidebarRaw != null) {
            boolean sidebarCollapsed = toBoolean(sidebarRaw, "sidebar_collapsed");
            if (!Boolean.valueOf(sidebarCollapsed).equals(profile.getSidebarCollapsed())) {
                profile.setSidebarCollapsed(sidebarCollapsed);
                profileChanged = true;
            }
        }

        Object languageRaw = preferenceValue(safePayload, preferencesPayload, "preferred_language");
        if (languageRaw != null) {
            String preferredLanguage = normalizeLanguage(languageRaw);
            if (!preferredLanguage.equals(profile.getPreferredLanguage())) {
                profile.setPreferredLanguage(preferredLanguage);
                profileChanged = true;
            }
        }

        Object vimRaw = preferenceValue(safePayload, preferencesPayload, "vim_mode");
        if (vimRaw != null) {
            boolean vimMode = toBoolean(vimRaw, "vim_mode");
            if (!Boolean.valueOf(vimMode).equals(profile.getVimMode())) {
                profile.setVimMode(vimMode);
                profileChanged = true;
            }
        }

        Object institutionRaw = preferenceValue(safePayload, preferencesPayload, "active_institution_id");
        if (institutionRaw != null
                || safePayload.containsKey("active_institution_id")
                || preferencesPayload.containsKey("active_institution_id")) {
            String activeInstitutionId = nullableTrimmed(institutionRaw);
            if (!safeEquals(activeInstitutionId, profile.getActiveInstitutionId())) {
                profile.setActiveInstitutionId(activeInstitutionId);
                profileChanged = true;
            }
        }

        Object localeRaw = preferenceValue(safePayload, preferencesPayload, "locale");
        if (localeRaw != null || safePayload.containsKey("locale") || preferencesPayload.containsKey("locale")) {
            String locale = nullableTrimmed(localeRaw);
            if (!safeEquals(locale, profile.getLocale())) {
                profile.setLocale(locale);
                profileChanged = true;
            }
        }

        Object timezoneRaw = preferenceValue(safePayload, preferencesPayload, "timezone");
        if (timezoneRaw != null
                || safePayload.containsKey("timezone")
                || preferencesPayload.containsKey("timezone")) {
            String timezone = nullableTrimmed(timezoneRaw);
            if (!safeEquals(timezone, profile.getTimezone())) {
                profile.setTimezone(timezone);
                profileChanged = true;
            }
        }

        UserEntity savedUser = userChanged ? userRepository.save(user) : user;
        UserProfileEntity savedProfile = profileChanged ? userProfileRepository.save(profile) : profile;

        return withMessage("Profile updated", buildPayload(savedUser, savedProfile));
    }

    private Map<String, Object> withMessage(String message, Map<String, Object> payload) {
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("message", message);
        response.putAll(payload);
        return response;
    }

    private Map<String, Object> buildPayload(UserEntity user, UserProfileEntity profile) {
        PerformanceEntity performance = performanceRepository.findByUserId(user.getId()).orElse(null);
        UserAnalyticsEntity analytics = userAnalyticsRepository.findById(user.getId()).orElse(null);

        int streak = safe(analytics == null ? null : analytics.getStreakDays());
        if (streak == 0) {
            streak = safe(performance == null ? null : performance.getStreak());
        }

        Map<String, Object> userPayload = new LinkedHashMap<>();
        userPayload.put("id", user.getId());
        userPayload.put("clerk_id", user.getClerkId());
        userPayload.put("name", user.getName());
        userPayload.put("email", user.getEmail());
        userPayload.put("bio", emptyWhenNull(user.getBio()));
        userPayload.put("profile_image", emptyWhenNull(user.getProfileImage()));
        userPayload.put("role", user.getRole());
        userPayload.put("created_at", user.getCreatedAt());
        userPayload.put("great_moves", safe(performance == null ? null : performance.getGreatMoves()));
        userPayload.put("mistakes", safe(performance == null ? null : performance.getMistakes()));
        userPayload.put("blunders", safe(performance == null ? null : performance.getBlunders()));
        userPayload.put("streak", streak);

        Map<String, Object> preferencesPayload = new LinkedHashMap<>();
        preferencesPayload.put("theme_mode", normalizeThemeOrDefault(profile.getThemeMode()));
        preferencesPayload.put("editor_font_size", normalizeFontSize(profile.getEditorFontSize()));
        preferencesPayload.put("sidebar_collapsed", profile.getSidebarCollapsed() != null && profile.getSidebarCollapsed());
        preferencesPayload.put("preferred_language", normalizeLanguageOrDefault(profile.getPreferredLanguage()));
        preferencesPayload.put("vim_mode", profile.getVimMode() != null && profile.getVimMode());
        preferencesPayload.put("active_institution_id", emptyWhenNull(profile.getActiveInstitutionId()));
        preferencesPayload.put("locale", emptyWhenNull(profile.getLocale()));
        preferencesPayload.put("timezone", emptyWhenNull(profile.getTimezone()));

        Map<String, Object> statsPayload = new LinkedHashMap<>();
        statsPayload.put("streak", streak);
        statsPayload.put("great_moves", safe(performance == null ? null : performance.getGreatMoves()));
        statsPayload.put("mistakes", safe(performance == null ? null : performance.getMistakes()));
        statsPayload.put("blunders", safe(performance == null ? null : performance.getBlunders()));
        statsPayload.put("total_solved", safe(analytics == null ? null : analytics.getTotalSolved()));
        statsPayload.put("total_attempts", safe(analytics == null ? null : analytics.getTotalAttempts()));
        statsPayload.put("total_hints_used", safe(analytics == null ? null : analytics.getTotalHintsUsed()));
        statsPayload.put(
                "independence_score",
                round2(analytics == null ? null : analytics.getIndependenceScore())
        );
        statsPayload.put(
                "overall_rank",
                round2(analytics == null ? null : analytics.getOverallRankScore())
        );

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("user", userPayload);
        payload.put("preferences", preferencesPayload);
        payload.put("stats", statsPayload);
        return payload;
    }

    private UserProfileEntity getOrCreateProfile(Long userId) {
        return userProfileRepository.findByUserId(userId)
                .map(this::applyProfileDefaultsIfMissing)
                .orElseGet(() -> userProfileRepository.save(buildDefaultProfile(userId)));
    }

    private UserProfileEntity buildDefaultProfile(Long userId) {
        UserProfileEntity profile = new UserProfileEntity();
        profile.setUserId(userId);
        profile.setThemeMode("dark");
        profile.setEditorFontSize(15);
        profile.setSidebarCollapsed(false);
        profile.setPreferredLanguage("javascript");
        profile.setVimMode(false);
        return profile;
    }

    private UserProfileEntity applyProfileDefaultsIfMissing(UserProfileEntity profile) {
        boolean changed = false;

        String normalizedTheme = normalizeThemeOrDefault(profile.getThemeMode());
        if (!normalizedTheme.equals(profile.getThemeMode())) {
            profile.setThemeMode(normalizedTheme);
            changed = true;
        }

        Integer normalizedFontSize = normalizeFontSize(profile.getEditorFontSize());
        if (!normalizedFontSize.equals(profile.getEditorFontSize())) {
            profile.setEditorFontSize(normalizedFontSize);
            changed = true;
        }

        if (profile.getSidebarCollapsed() == null) {
            profile.setSidebarCollapsed(false);
            changed = true;
        }

        String language = normalizeLanguageOrDefault(profile.getPreferredLanguage());
        if (!language.equals(profile.getPreferredLanguage())) {
            profile.setPreferredLanguage(language);
            changed = true;
        }

        if (profile.getVimMode() == null) {
            profile.setVimMode(false);
            changed = true;
        }

        return changed ? userProfileRepository.save(profile) : profile;
    }

    private String normalizeTheme(Object rawValue) {
        String value = normalizedLowercaseString(rawValue);
        if (!ALLOWED_THEMES.contains(value)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "theme_mode must be dark or light");
        }
        return value;
    }

    private String normalizeLanguage(Object rawValue) {
        String value = normalizedLowercaseString(rawValue);
        if (!ALLOWED_LANGUAGES.contains(value)) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "preferred_language must be one of javascript, python, java, cpp"
            );
        }
        return value;
    }

    private String normalizeThemeOrDefault(String themeMode) {
        String normalized = themeMode == null ? "" : themeMode.trim().toLowerCase(Locale.ROOT);
        return ALLOWED_THEMES.contains(normalized) ? normalized : "dark";
    }

    private Integer normalizeFontSize(Integer editorFontSize) {
        return clamp(editorFontSize == null ? 15 : editorFontSize, 12, 22);
    }

    private String normalizeLanguageOrDefault(String preferredLanguage) {
        String normalized = preferredLanguage == null
                ? ""
                : preferredLanguage.trim().toLowerCase(Locale.ROOT);
        return ALLOWED_LANGUAGES.contains(normalized) ? normalized : "javascript";
    }

    private Map<String, Object> toStringKeyMap(Object value) {
        if (!(value instanceof Map<?, ?> raw)) {
            return Collections.emptyMap();
        }

        Map<String, Object> mapped = new LinkedHashMap<>();
        for (Map.Entry<?, ?> entry : raw.entrySet()) {
            if (entry.getKey() instanceof String key) {
                mapped.put(key, entry.getValue());
            }
        }
        return mapped;
    }

    private Object preferenceValue(Map<String, Object> payload, Map<String, Object> preferences, String key) {
        if (preferences.containsKey(key)) {
            return preferences.get(key);
        }
        return payload.get(key);
    }

    private String nullableTrimmed(Object rawValue) {
        if (rawValue == null) {
            return null;
        }
        String value = String.valueOf(rawValue).trim();
        return value.isBlank() ? null : value;
    }

    private String trimmedString(Object rawValue) {
        if (rawValue == null) {
            return null;
        }
        String value = String.valueOf(rawValue).trim();
        return value.isBlank() ? null : value;
    }

    private String normalizedLowercaseString(Object rawValue) {
        String value = trimmedString(rawValue);
        if (value == null) {
            return null;
        }
        value = value.toLowerCase(Locale.ROOT);
        return value.isBlank() ? null : value;
    }

    private int toInteger(Object rawValue, String fieldName) {
        if (rawValue instanceof Number number) {
            return number.intValue();
        }
        try {
            return Integer.parseInt(String.valueOf(rawValue).trim());
        } catch (NumberFormatException ex) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be a number");
        }
    }

    private boolean toBoolean(Object rawValue, String fieldName) {
        if (rawValue instanceof Boolean value) {
            return value;
        }
        if (rawValue instanceof Number number) {
            return number.intValue() != 0;
        }

        String value = String.valueOf(rawValue).trim().toLowerCase(Locale.ROOT);
        if ("true".equals(value) || "1".equals(value)) {
            return true;
        }
        if ("false".equals(value) || "0".equals(value)) {
            return false;
        }

        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, fieldName + " must be a boolean");
    }

    private String readStringClaim(Map<String, Object> claims, String... keys) {
        if (claims == null || claims.isEmpty()) {
            return null;
        }

        for (String key : keys) {
            Object value = claims.get(key);
            if (value instanceof String str && !str.isBlank()) {
                return str;
            }
        }

        return null;
    }

    private String emptyWhenNull(String value) {
        return value == null ? "" : value;
    }

    private int safe(Integer value) {
        return value == null ? 0 : value;
    }

    private double round2(Double value) {
        if (value == null) {
            return 0.0;
        }
        return Math.round(value * 100.0) / 100.0;
    }

    private int clamp(int value, int min, int max) {
        if (value < min) {
            return min;
        }
        if (value > max) {
            return max;
        }
        return value;
    }

    private boolean safeEquals(String left, String right) {
        if (left == null && right == null) {
            return true;
        }
        if (left == null || right == null) {
            return false;
        }
        return left.equals(right);
    }
}
