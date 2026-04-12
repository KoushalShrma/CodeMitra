-- Institution-mode schema for organization-scoped tests, custom problem banks, and proctoring.

CREATE TABLE IF NOT EXISTS institutions (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(180) NOT NULL,
  type VARCHAR(20) NOT NULL,
  logo_url VARCHAR(255) NULL,
  legacy_institute_id INT NULL,
  subscription_tier VARCHAR(40) NOT NULL DEFAULT 'FREE',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS institution_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  institution_id BIGINT NOT NULL,
  role VARCHAR(40) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_institution_users_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_institution_users_institution
    FOREIGN KEY (institution_id)
    REFERENCES institutions(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_institution_user_membership (user_id, institution_id)
) ENGINE=InnoDB;

SET @sql_tests_institution_id = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'institution_id'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN institution_id BIGINT NULL'
  )
);
PREPARE stmt_tests_institution_id FROM @sql_tests_institution_id;
EXECUTE stmt_tests_institution_id;
DEALLOCATE PREPARE stmt_tests_institution_id;

SET @sql_tests_duration_minutes = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'duration_minutes'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN duration_minutes INT NULL'
  )
);
PREPARE stmt_tests_duration_minutes FROM @sql_tests_duration_minutes;
EXECUTE stmt_tests_duration_minutes;
DEALLOCATE PREPARE stmt_tests_duration_minutes;

SET @sql_tests_allow_ai_hints = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'allow_ai_hints'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN allow_ai_hints TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_tests_allow_ai_hints FROM @sql_tests_allow_ai_hints;
EXECUTE stmt_tests_allow_ai_hints;
DEALLOCATE PREPARE stmt_tests_allow_ai_hints;

SET @sql_tests_ai_hint_cooldown = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'ai_hint_cooldown_minutes'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN ai_hint_cooldown_minutes INT NOT NULL DEFAULT 10'
  )
);
PREPARE stmt_tests_ai_hint_cooldown FROM @sql_tests_ai_hint_cooldown;
EXECUTE stmt_tests_ai_hint_cooldown;
DEALLOCATE PREPARE stmt_tests_ai_hint_cooldown;

SET @sql_tests_max_hints = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'max_hints_per_problem'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN max_hints_per_problem INT NOT NULL DEFAULT 3'
  )
);
PREPARE stmt_tests_max_hints FROM @sql_tests_max_hints;
EXECUTE stmt_tests_max_hints;
DEALLOCATE PREPARE stmt_tests_max_hints;

SET @sql_tests_is_proctored = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'is_proctored'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN is_proctored TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_tests_is_proctored FROM @sql_tests_is_proctored;
EXECUTE stmt_tests_is_proctored;
DEALLOCATE PREPARE stmt_tests_is_proctored;

SET @sql_tests_created_by = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'created_by'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN created_by INT NULL'
  )
);
PREPARE stmt_tests_created_by FROM @sql_tests_created_by;
EXECUTE stmt_tests_created_by;
DEALLOCATE PREPARE stmt_tests_created_by;

SET @sql_attempts_submitted_at = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'test_attempts'
        AND COLUMN_NAME = 'submitted_at'
    ),
    'SELECT 1',
    'ALTER TABLE test_attempts ADD COLUMN submitted_at DATETIME NULL'
  )
);
PREPARE stmt_attempts_submitted_at FROM @sql_attempts_submitted_at;
EXECUTE stmt_attempts_submitted_at;
DEALLOCATE PREPARE stmt_attempts_submitted_at;

SET @sql_attempts_total_score = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'test_attempts'
        AND COLUMN_NAME = 'total_score'
    ),
    'SELECT 1',
    'ALTER TABLE test_attempts ADD COLUMN total_score INT NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_attempts_total_score FROM @sql_attempts_total_score;
EXECUTE stmt_attempts_total_score;
DEALLOCATE PREPARE stmt_attempts_total_score;

UPDATE tests SET duration_minutes = duration WHERE duration_minutes IS NULL;
UPDATE tests SET institution_id = institute_id WHERE institution_id IS NULL AND institute_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS test_problems (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  problem_id VARCHAR(120) NOT NULL,
  order_index INT NOT NULL,
  marks INT NOT NULL DEFAULT 100,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_problems_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_test_problem_order (test_id, order_index),
  UNIQUE KEY uk_test_problem_unique (test_id, problem_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS custom_problems (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  institution_id BIGINT NOT NULL,
  title VARCHAR(220) NOT NULL,
  description LONGTEXT NOT NULL,
  difficulty VARCHAR(30) NOT NULL,
  topic_tags JSON NOT NULL,
  time_limit_ms INT NOT NULL,
  memory_limit_mb INT NOT NULL,
  is_public TINYINT(1) NOT NULL DEFAULT 0,
  created_by INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_custom_problems_institution
    FOREIGN KEY (institution_id)
    REFERENCES institutions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_custom_problems_user
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS custom_test_cases (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  problem_id BIGINT NOT NULL,
  input LONGTEXT NOT NULL,
  expected_output LONGTEXT NOT NULL,
  is_sample TINYINT(1) NOT NULL DEFAULT 0,
  is_hidden TINYINT(1) NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_custom_test_cases_problem
    FOREIGN KEY (problem_id)
    REFERENCES custom_problems(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS proctoring_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  attempt_id INT NOT NULL,
  user_id INT NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  event_payload JSON NULL,
  occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_proctoring_events_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_proctoring_events_attempt
    FOREIGN KEY (attempt_id)
    REFERENCES test_attempts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_proctoring_events_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_proctoring_attempt (attempt_id, occurred_at)
) ENGINE=InnoDB;
