-- Analytics backbone tables used by the adaptive mentoring and ranking engine.

CREATE TABLE IF NOT EXISTS user_analytics (
  user_id INT PRIMARY KEY,
  topic_scores JSON NOT NULL,
  consistency_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  independence_score DECIMAL(8,2) NOT NULL DEFAULT 100,
  speed_percentile DECIMAL(8,2) NOT NULL DEFAULT 0,
  code_quality_rating DECIMAL(8,2) NOT NULL DEFAULT 0,
  overall_rank_score DECIMAL(8,2) NOT NULL DEFAULT 0,
  total_solved INT NOT NULL DEFAULT 0,
  total_attempts INT NOT NULL DEFAULT 0,
  total_hints_used INT NOT NULL DEFAULT 0,
  streak_days INT NOT NULL DEFAULT 0,
  last_activity_date DATE NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_analytics_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_attempts (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(120) NOT NULL,
  test_id BIGINT NULL,
  time_to_first_run BIGINT NOT NULL DEFAULT 0,
  time_to_submit BIGINT NOT NULL DEFAULT 0,
  total_session_time BIGINT NOT NULL DEFAULT 0,
  run_count INT NOT NULL DEFAULT 0,
  submit_count INT NOT NULL DEFAULT 0,
  wrong_submissions INT NOT NULL DEFAULT 0,
  compile_errors INT NOT NULL DEFAULT 0,
  runtime_errors INT NOT NULL DEFAULT 0,
  hints_requested INT NOT NULL DEFAULT 0,
  hint_timestamps JSON NULL,
  ai_cooldown_violations_attempted INT NOT NULL DEFAULT 0,
  verdict VARCHAR(10) NOT NULL DEFAULT 'SKIP',
  language_used VARCHAR(50) NULL,
  final_code LONGTEXT NULL,
  final_code_length INT NOT NULL DEFAULT 0,
  topic_tags JSON NULL,
  groq_review JSON NULL,
  last_hint_timestamp DATETIME NULL,
  session_started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_problem_attempts_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_problem_attempts_user_problem (user_id, problem_id),
  INDEX idx_problem_attempts_problem_verdict (problem_id, verdict),
  INDEX idx_problem_attempts_updated_at (updated_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hint_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(120) NOT NULL,
  hint_number INT NOT NULL,
  requested_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  cooldown_remaining_at_request INT NOT NULL DEFAULT 0,
  groq_response TEXT,
  CONSTRAINT fk_hint_logs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_hint_logs_user_problem (user_id, problem_id, requested_at)
) ENGINE=InnoDB;

SET @sql_groq_review = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problem_submissions'
        AND COLUMN_NAME = 'groq_review'
    ),
    'SELECT 1',
    'ALTER TABLE problem_submissions ADD COLUMN groq_review JSON NULL'
  )
);
PREPARE stmt_groq_review FROM @sql_groq_review;
EXECUTE stmt_groq_review;
DEALLOCATE PREPARE stmt_groq_review;

SET @sql_chess_rating = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problem_submissions'
        AND COLUMN_NAME = 'chess_rating'
    ),
    'SELECT 1',
    'ALTER TABLE problem_submissions ADD COLUMN chess_rating VARCHAR(30) NULL'
  )
);
PREPARE stmt_chess_rating FROM @sql_chess_rating;
EXECUTE stmt_chess_rating;
DEALLOCATE PREPARE stmt_chess_rating;

SET @sql_overall_score = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problem_submissions'
        AND COLUMN_NAME = 'overall_score'
    ),
    'SELECT 1',
    'ALTER TABLE problem_submissions ADD COLUMN overall_score DECIMAL(5,2) NULL'
  )
);
PREPARE stmt_overall_score FROM @sql_overall_score;
EXECUTE stmt_overall_score;
DEALLOCATE PREPARE stmt_overall_score;
