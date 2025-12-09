-- V1__Initial_Schema.sql
-- CodeMitra Database Schema

-- Users table (linked to Clerk)
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    clerk_user_id VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255),
    role VARCHAR(50) NOT NULL DEFAULT 'STUDENT',
    branch VARCHAR(100),
    year_of_study INT,
    college VARCHAR(255),
    preferred_language VARCHAR(50) DEFAULT 'PYTHON',
    profile_image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_clerk_user_id (clerk_user_id),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Problems table
CREATE TABLE problems (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    pattern_tag VARCHAR(100) NOT NULL,
    constraints_text TEXT,
    sample_input TEXT,
    sample_output TEXT,
    hidden_test_cases JSON,
    created_by BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_difficulty (difficulty),
    INDEX idx_pattern_tag (pattern_tag),
    INDEX idx_slug (slug)
);

-- Problem stages (BRUTE, IMPROVED, OPTIMAL)
CREATE TABLE problem_stages (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    problem_id BIGINT NOT NULL,
    stage_type VARCHAR(20) NOT NULL,
    recommended_approach_text TEXT,
    expected_time_complexity VARCHAR(50),
    expected_space_complexity VARCHAR(50),
    min_attempts_before_hint INT DEFAULT 2,
    min_seconds_before_hint INT DEFAULT 90,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY uk_problem_stage (problem_id, stage_type),
    INDEX idx_problem_id (problem_id)
);

-- Submissions table
CREATE TABLE submissions (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    test_id BIGINT,
    stage_type VARCHAR(20) NOT NULL,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    status VARCHAR(20) NOT NULL,
    runtime_ms BIGINT,
    memory_kb BIGINT,
    test_result_json JSON,
    stdout TEXT,
    stderr TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_problem_id (problem_id),
    INDEX idx_test_id (test_id),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at)
);

-- Hints table
CREATE TABLE hints (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    problem_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    submission_id BIGINT,
    stage_type VARCHAR(20) NOT NULL,
    hint_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE SET NULL,
    INDEX idx_user_problem (user_id, problem_id)
);

-- User progress tracking
CREATE TABLE user_progress (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    brute_completed BOOLEAN DEFAULT FALSE,
    improved_completed BOOLEAN DEFAULT FALSE,
    optimal_completed BOOLEAN DEFAULT FALSE,
    first_attempt_at TIMESTAMP,
    brute_completed_at TIMESTAMP,
    improved_completed_at TIMESTAMP,
    optimal_completed_at TIMESTAMP,
    total_attempts INT DEFAULT 0,
    total_hints_used INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_problem (user_id, problem_id),
    INDEX idx_user_id (user_id)
);

-- Tests table (for institutional assessments)
CREATE TABLE tests (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    duration_minutes INT NOT NULL,
    allowed_languages JSON,
    hints_disabled BOOLEAN DEFAULT TRUE,
    created_by BIGINT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_start_time (start_time),
    INDEX idx_end_time (end_time),
    INDEX idx_created_by (created_by)
);

-- Test problems mapping
CREATE TABLE test_problems (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_id BIGINT NOT NULL,
    problem_id BIGINT NOT NULL,
    max_score INT DEFAULT 100,
    problem_order INT DEFAULT 0,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE,
    UNIQUE KEY uk_test_problem (test_id, problem_id),
    INDEX idx_test_id (test_id)
);

-- Test participants
CREATE TABLE test_participants (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    started_at TIMESTAMP,
    submitted_at TIMESTAMP,
    total_score INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'NOT_STARTED',
    tab_switch_count INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY uk_test_user (test_id, user_id),
    INDEX idx_test_id (test_id),
    INDEX idx_user_id (user_id)
);

-- Proctoring events
CREATE TABLE proctoring_events (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    test_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    metadata_json JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (test_id) REFERENCES tests(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_test_user (test_id, user_id),
    INDEX idx_event_type (event_type)
);

-- User statistics for gamification
CREATE TABLE user_stats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL UNIQUE,
    problems_solved_count INT DEFAULT 0,
    brute_count INT DEFAULT 0,
    improved_count INT DEFAULT 0,
    optimal_count INT DEFAULT 0,
    current_streak INT DEFAULT 0,
    longest_streak INT DEFAULT 0,
    last_activity_date DATE,
    patterns_mastered_json JSON,
    badges_json JSON,
    total_tests_taken INT DEFAULT 0,
    average_test_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Badges definition
CREATE TABLE badges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    icon_url VARCHAR(500),
    criteria_type VARCHAR(50) NOT NULL,
    criteria_value INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User badges (earned badges)
CREATE TABLE user_badges (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    badge_id BIGINT NOT NULL,
    earned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (badge_id) REFERENCES badges(id) ON DELETE CASCADE,
    UNIQUE KEY uk_user_badge (user_id, badge_id)
);
