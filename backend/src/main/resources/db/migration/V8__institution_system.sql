-- Section 1: Three-tier institution system schema (safe forward migration).

CREATE TABLE IF NOT EXISTS admin_users (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(40) NOT NULL DEFAULT 'SUPER_ADMIN',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

SET @sql_institutions_code_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'code'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN code VARCHAR(40) NULL'
  )
);
PREPARE stmt_institutions_code_column FROM @sql_institutions_code_column;
EXECUTE stmt_institutions_code_column;
DEALLOCATE PREPARE stmt_institutions_code_column;

SET @sql_institutions_status_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'status'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT ''ACTIVE'''
  )
);
PREPARE stmt_institutions_status_column FROM @sql_institutions_status_column;
EXECUTE stmt_institutions_status_column;
DEALLOCATE PREPARE stmt_institutions_status_column;

SET @sql_institutions_approved_by_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'approved_by_admin_id'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN approved_by_admin_id BIGINT NULL'
  )
);
PREPARE stmt_institutions_approved_by_column FROM @sql_institutions_approved_by_column;
EXECUTE stmt_institutions_approved_by_column;
DEALLOCATE PREPARE stmt_institutions_approved_by_column;

SET @sql_institutions_approved_at_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'approved_at'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN approved_at DATETIME NULL'
  )
);
PREPARE stmt_institutions_approved_at_column FROM @sql_institutions_approved_at_column;
EXECUTE stmt_institutions_approved_at_column;
DEALLOCATE PREPARE stmt_institutions_approved_at_column;

SET @sql_institutions_updated_at_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'updated_at'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  )
);
PREPARE stmt_institutions_updated_at_column FROM @sql_institutions_updated_at_column;
EXECUTE stmt_institutions_updated_at_column;
DEALLOCATE PREPARE stmt_institutions_updated_at_column;

UPDATE institutions
SET code = CONCAT('INST-', LPAD(id, 6, '0'))
WHERE code IS NULL OR TRIM(code) = '';

SET @sql_institutions_code_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND INDEX_NAME = 'uk_institutions_code'
    ),
    'SELECT 1',
    'CREATE UNIQUE INDEX uk_institutions_code ON institutions (code)'
  )
);
PREPARE stmt_institutions_code_unique FROM @sql_institutions_code_unique;
EXECUTE stmt_institutions_code_unique;
DEALLOCATE PREPARE stmt_institutions_code_unique;

SET @sql_institutions_approved_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND CONSTRAINT_NAME = 'fk_institutions_approved_by_admin'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD CONSTRAINT fk_institutions_approved_by_admin FOREIGN KEY (approved_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL'
  )
);
PREPARE stmt_institutions_approved_fk FROM @sql_institutions_approved_fk;
EXECUTE stmt_institutions_approved_fk;
DEALLOCATE PREPARE stmt_institutions_approved_fk;

CREATE TABLE IF NOT EXISTS institution_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  institution_name VARCHAR(180) NOT NULL,
  institution_type VARCHAR(20) NOT NULL,
  official_email VARCHAR(160) NOT NULL,
  contact_name VARCHAR(120) NOT NULL,
  contact_email VARCHAR(160) NOT NULL,
  contact_phone VARCHAR(30) NULL,
  website VARCHAR(255) NULL,
  message TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by_admin_id BIGINT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_institution_requests_admin
    FOREIGN KEY (reviewed_by_admin_id)
    REFERENCES admin_users(id)
    ON DELETE SET NULL,
  INDEX idx_institution_requests_status (status, created_at)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS institution_join_requests (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  institution_id BIGINT NOT NULL,
  user_id INT NOT NULL,
  message TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  reviewed_by_user_id INT NULL,
  reviewed_at DATETIME NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_join_requests_institution
    FOREIGN KEY (institution_id)
    REFERENCES institutions(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_join_requests_reviewed_by
    FOREIGN KEY (reviewed_by_user_id)
    REFERENCES users(id)
    ON DELETE SET NULL,
  UNIQUE KEY uk_join_request_unique_pending (institution_id, user_id, status),
  INDEX idx_join_requests_status (institution_id, status, created_at)
) ENGINE=InnoDB;

SET @sql_tests_join_code_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'join_code'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN join_code VARCHAR(20) NULL'
  )
);
PREPARE stmt_tests_join_code_column FROM @sql_tests_join_code_column;
EXECUTE stmt_tests_join_code_column;
DEALLOCATE PREPARE stmt_tests_join_code_column;

SET @sql_tests_access_scope_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'access_scope'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN access_scope VARCHAR(40) NOT NULL DEFAULT ''INSTITUTION_MEMBERS'''
  )
);
PREPARE stmt_tests_access_scope_column FROM @sql_tests_access_scope_column;
EXECUTE stmt_tests_access_scope_column;
DEALLOCATE PREPARE stmt_tests_access_scope_column;

SET @sql_tests_published_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'published'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN published TINYINT(1) NOT NULL DEFAULT 1'
  )
);
PREPARE stmt_tests_published_column FROM @sql_tests_published_column;
EXECUTE stmt_tests_published_column;
DEALLOCATE PREPARE stmt_tests_published_column;

SET @sql_tests_updated_at_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'tests'
        AND COLUMN_NAME = 'updated_at'
    ),
    'SELECT 1',
    'ALTER TABLE tests ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'
  )
);
PREPARE stmt_tests_updated_at_column FROM @sql_tests_updated_at_column;
EXECUTE stmt_tests_updated_at_column;
DEALLOCATE PREPARE stmt_tests_updated_at_column;
