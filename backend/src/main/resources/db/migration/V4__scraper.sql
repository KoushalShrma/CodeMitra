-- Scraper and canonical problems schema.

CREATE TABLE IF NOT EXISTS problems (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  problem_key VARCHAR(191) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  difficulty VARCHAR(30) NOT NULL DEFAULT 'Medium',
  topic_tags JSON,
  time_limit_ms INT NULL,
  memory_limit_mb INT NULL,
  source VARCHAR(100),
  where_asked VARCHAR(500),
  external_url VARCHAR(500),
  is_verified TINYINT(1) NOT NULL DEFAULT 0,
  scrape_hash VARCHAR(64),
  problem_summary TEXT,
  difficulty_explanation TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_problems_source (source),
  INDEX idx_problems_verified (is_verified),
  INDEX idx_problems_scrape_hash (scrape_hash)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS scraper_sources (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  base_url VARCHAR(500) NOT NULL,
  last_scraped_at DATETIME NULL,
  problems_scraped INT NOT NULL DEFAULT 0,
  is_active TINYINT(1) NOT NULL DEFAULT 1,
  scrape_interval_hours INT NOT NULL DEFAULT 168,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS scraped_problems (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  source_id BIGINT NOT NULL,
  external_id VARCHAR(255),
  title VARCHAR(255) NOT NULL,
  description LONGTEXT,
  difficulty_raw VARCHAR(120),
  difficulty_normalized ENUM('Easy', 'Medium', 'Hard') NOT NULL DEFAULT 'Medium',
  topic_tags JSON,
  time_limit_ms INT NULL,
  memory_limit_mb INT NULL,
  where_asked VARCHAR(500),
  source_url VARCHAR(500),
  content_hash VARCHAR(64) NOT NULL,
  import_status ENUM('PENDING', 'IMPORTED', 'DUPLICATE', 'FAILED') NOT NULL DEFAULT 'PENDING',
  scraped_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  imported_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_scraped_problems_source
    FOREIGN KEY (source_id)
    REFERENCES scraper_sources(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_scraped_problem_source_external (source_id, external_id),
  INDEX idx_scraped_problem_hash (content_hash),
  INDEX idx_scraped_problem_status (import_status),
  INDEX idx_scraped_problem_scraped_at (scraped_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS scraper_run_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  run_started_at DATETIME NOT NULL,
  run_ended_at DATETIME NULL,
  source_id BIGINT NOT NULL,
  new_count INT NOT NULL DEFAULT 0,
  duplicate_count INT NOT NULL DEFAULT 0,
  failed_count INT NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_scraper_run_logs_source
    FOREIGN KEY (source_id)
    REFERENCES scraper_sources(id)
    ON DELETE CASCADE,
  INDEX idx_scraper_run_logs_source_start (source_id, run_started_at)
) ENGINE=InnoDB;

-- Ensure required columns are present when a legacy problems table already exists.
SET @sql_problems_source = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'source'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN source VARCHAR(100)'
  )
);
PREPARE stmt_problems_source FROM @sql_problems_source;
EXECUTE stmt_problems_source;
DEALLOCATE PREPARE stmt_problems_source;

SET @sql_problems_where_asked = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'where_asked'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN where_asked VARCHAR(500)'
  )
);
PREPARE stmt_problems_where_asked FROM @sql_problems_where_asked;
EXECUTE stmt_problems_where_asked;
DEALLOCATE PREPARE stmt_problems_where_asked;

SET @sql_problems_external_url = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'external_url'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN external_url VARCHAR(500)'
  )
);
PREPARE stmt_problems_external_url FROM @sql_problems_external_url;
EXECUTE stmt_problems_external_url;
DEALLOCATE PREPARE stmt_problems_external_url;

SET @sql_problems_is_verified = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'is_verified'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN is_verified TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_problems_is_verified FROM @sql_problems_is_verified;
EXECUTE stmt_problems_is_verified;
DEALLOCATE PREPARE stmt_problems_is_verified;

SET @sql_problems_scrape_hash = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'scrape_hash'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN scrape_hash VARCHAR(64)'
  )
);
PREPARE stmt_problems_scrape_hash FROM @sql_problems_scrape_hash;
EXECUTE stmt_problems_scrape_hash;
DEALLOCATE PREPARE stmt_problems_scrape_hash;

SET @sql_problems_summary = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'problem_summary'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN problem_summary TEXT'
  )
);
PREPARE stmt_problems_summary FROM @sql_problems_summary;
EXECUTE stmt_problems_summary;
DEALLOCATE PREPARE stmt_problems_summary;

SET @sql_problems_difficulty_explanation = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'problems'
        AND COLUMN_NAME = 'difficulty_explanation'
    ),
    'SELECT 1',
    'ALTER TABLE problems ADD COLUMN difficulty_explanation TEXT'
  )
);
PREPARE stmt_problems_difficulty_explanation FROM @sql_problems_difficulty_explanation;
EXECUTE stmt_problems_difficulty_explanation;
DEALLOCATE PREPARE stmt_problems_difficulty_explanation;

INSERT INTO scraper_sources (name, base_url, scrape_interval_hours, is_active)
VALUES
  ('Project Euler', 'https://projecteuler.net', 168, 1),
  ('CSES', 'https://cses.fi/problemset', 168, 1),
  ('Kattis', 'https://open.kattis.com', 168, 1),
  ('SPOJ', 'https://www.spoj.com/problems/classical', 168, 1),
  ('GitHub Datasets', 'https://api.github.com', 168, 1),
  ('Codeforces', 'https://codeforces.com/api', 168, 1),
  ('AtCoder', 'https://kenkoooo.com/atcoder/resources/problems.json', 168, 1)
ON DUPLICATE KEY UPDATE
  base_url = VALUES(base_url),
  scrape_interval_hours = VALUES(scrape_interval_hours),
  is_active = VALUES(is_active);
