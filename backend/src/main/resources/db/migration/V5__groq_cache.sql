-- Groq cache and usage governance schema.

CREATE TABLE IF NOT EXISTS groq_hint_cache (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  problem_id BIGINT NOT NULL,
  hint_number INT NOT NULL,
  hint_text TEXT NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  used_count INT NOT NULL DEFAULT 0,
  last_used_at DATETIME NULL,
  CONSTRAINT fk_groq_hint_cache_problem
    FOREIGN KEY (problem_id)
    REFERENCES problems(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_groq_hint_cache_problem_hint (problem_id, hint_number),
  INDEX idx_groq_hint_cache_used_count (used_count)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS groq_cache_stats (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  cache_key VARCHAR(255) NOT NULL UNIQUE,
  hit_count BIGINT NOT NULL DEFAULT 0,
  miss_count BIGINT NOT NULL DEFAULT 0,
  tokens_saved_estimate BIGINT NOT NULL DEFAULT 0,
  last_hit_at DATETIME NULL,
  last_miss_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS problem_editorials (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  problem_id BIGINT NOT NULL,
  editorial_text TEXT NOT NULL,
  generated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  generated_by_user_id INT NULL,
  CONSTRAINT fk_problem_editorials_problem
    FOREIGN KEY (problem_id)
    REFERENCES problems(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_problem_editorials_user
    FOREIGN KEY (generated_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,
  UNIQUE KEY uk_problem_editorials_problem (problem_id)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS groq_usage_log (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  call_type ENUM('HINT', 'REVIEW', 'SUMMARY', 'CHAT', 'EDITORIAL', 'DIFFICULTY') NOT NULL,
  tokens_used_input INT NOT NULL DEFAULT 0,
  tokens_used_output INT NOT NULL DEFAULT 0,
  model_used VARCHAR(120) NOT NULL,
  cache_hit TINYINT(1) NOT NULL DEFAULT 0,
  cost_estimate_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.000000,
  user_id INT NULL,
  problem_id BIGINT NULL,
  called_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_groq_usage_log_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,
  CONSTRAINT fk_groq_usage_log_problem
    FOREIGN KEY (problem_id)
    REFERENCES problems(id)
    ON DELETE SET NULL,
  INDEX idx_groq_usage_called_at (called_at),
  INDEX idx_groq_usage_call_type (call_type),
  INDEX idx_groq_usage_problem (problem_id)
) ENGINE=InnoDB;
