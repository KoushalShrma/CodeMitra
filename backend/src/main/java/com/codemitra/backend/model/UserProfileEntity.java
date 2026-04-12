package com.codemitra.backend.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

/**
 * Stores durable per-user UI and workspace preferences.
 */
@Getter
@Setter
@Entity
@Table(name = "user_profiles")
public class UserProfileEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id", nullable = false, columnDefinition = "INT")
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true, columnDefinition = "INT")
    private Long userId;

    @Column(name = "theme_mode", nullable = false, length = 20)
    private String themeMode = "dark";

    @Column(name = "editor_font_size", nullable = false)
    private Integer editorFontSize = 15;

    @Column(name = "sidebar_collapsed", nullable = false)
    private Boolean sidebarCollapsed = false;

    @Column(name = "preferred_language", nullable = false, length = 30)
    private String preferredLanguage = "javascript";

    @Column(name = "vim_mode", nullable = false)
    private Boolean vimMode = false;

    @Column(name = "active_institution_id", length = 64)
    private String activeInstitutionId;

    @Column(name = "locale", length = 16)
    private String locale;

    @Column(name = "timezone", length = 64)
    private String timezone;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
