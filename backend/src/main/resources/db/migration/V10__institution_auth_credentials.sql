-- Section 1: Institution credential auth foundation and outbound email audit logs.

SET @sql_institutions_official_email_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'official_email'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN official_email VARCHAR(160) NULL'
  )
);
PREPARE stmt_institutions_official_email_column FROM @sql_institutions_official_email_column;
EXECUTE stmt_institutions_official_email_column;
DEALLOCATE PREPARE stmt_institutions_official_email_column;

SET @sql_institutions_login_email_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'login_email'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN login_email VARCHAR(160) NULL'
  )
);
PREPARE stmt_institutions_login_email_column FROM @sql_institutions_login_email_column;
EXECUTE stmt_institutions_login_email_column;
DEALLOCATE PREPARE stmt_institutions_login_email_column;

SET @sql_institutions_password_hash_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'password_hash'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN password_hash VARCHAR(255) NULL'
  )
);
PREPARE stmt_institutions_password_hash_column FROM @sql_institutions_password_hash_column;
EXECUTE stmt_institutions_password_hash_column;
DEALLOCATE PREPARE stmt_institutions_password_hash_column;

SET @sql_institutions_password_reset_required_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'password_reset_required'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN password_reset_required TINYINT(1) NOT NULL DEFAULT 1'
  )
);
PREPARE stmt_institutions_password_reset_required_column FROM @sql_institutions_password_reset_required_column;
EXECUTE stmt_institutions_password_reset_required_column;
DEALLOCATE PREPARE stmt_institutions_password_reset_required_column;

SET @sql_institutions_last_login_at_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'last_login_at'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN last_login_at DATETIME NULL'
  )
);
PREPARE stmt_institutions_last_login_at_column FROM @sql_institutions_last_login_at_column;
EXECUTE stmt_institutions_last_login_at_column;
DEALLOCATE PREPARE stmt_institutions_last_login_at_column;

SET @sql_institutions_password_changed_at_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'password_changed_at'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN password_changed_at DATETIME NULL'
  )
);
PREPARE stmt_institutions_password_changed_at_column FROM @sql_institutions_password_changed_at_column;
EXECUTE stmt_institutions_password_changed_at_column;
DEALLOCATE PREPARE stmt_institutions_password_changed_at_column;

SET @sql_institutions_contact_name_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'contact_name'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN contact_name VARCHAR(120) NULL'
  )
);
PREPARE stmt_institutions_contact_name_column FROM @sql_institutions_contact_name_column;
EXECUTE stmt_institutions_contact_name_column;
DEALLOCATE PREPARE stmt_institutions_contact_name_column;

SET @sql_institutions_contact_email_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'contact_email'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN contact_email VARCHAR(160) NULL'
  )
);
PREPARE stmt_institutions_contact_email_column FROM @sql_institutions_contact_email_column;
EXECUTE stmt_institutions_contact_email_column;
DEALLOCATE PREPARE stmt_institutions_contact_email_column;

SET @sql_institutions_contact_phone_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'contact_phone'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN contact_phone VARCHAR(30) NULL'
  )
);
PREPARE stmt_institutions_contact_phone_column FROM @sql_institutions_contact_phone_column;
EXECUTE stmt_institutions_contact_phone_column;
DEALLOCATE PREPARE stmt_institutions_contact_phone_column;

SET @sql_institutions_website_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND COLUMN_NAME = 'website'
    ),
    'SELECT 1',
    'ALTER TABLE institutions ADD COLUMN website VARCHAR(255) NULL'
  )
);
PREPARE stmt_institutions_website_column FROM @sql_institutions_website_column;
EXECUTE stmt_institutions_website_column;
DEALLOCATE PREPARE stmt_institutions_website_column;

UPDATE institutions
SET login_email = official_email
WHERE (login_email IS NULL OR TRIM(login_email) = '')
  AND official_email IS NOT NULL
  AND TRIM(official_email) <> '';

SET @sql_institutions_login_email_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institutions'
        AND INDEX_NAME = 'uk_institutions_login_email'
    ),
    'SELECT 1',
    'CREATE UNIQUE INDEX uk_institutions_login_email ON institutions (login_email)'
  )
);
PREPARE stmt_institutions_login_email_unique FROM @sql_institutions_login_email_unique;
EXECUTE stmt_institutions_login_email_unique;
DEALLOCATE PREPARE stmt_institutions_login_email_unique;

SET @sql_institution_requests_approved_institution_id_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institution_requests'
        AND COLUMN_NAME = 'approved_institution_id'
    ),
    'SELECT 1',
    'ALTER TABLE institution_requests ADD COLUMN approved_institution_id BIGINT NULL'
  )
);
PREPARE stmt_institution_requests_approved_institution_id_column FROM @sql_institution_requests_approved_institution_id_column;
EXECUTE stmt_institution_requests_approved_institution_id_column;
DEALLOCATE PREPARE stmt_institution_requests_approved_institution_id_column;

SET @sql_institution_requests_credentials_email_status_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institution_requests'
        AND COLUMN_NAME = 'credentials_email_status'
    ),
    'SELECT 1',
    'ALTER TABLE institution_requests ADD COLUMN credentials_email_status VARCHAR(20) NOT NULL DEFAULT ''NOT_SENT'''
  )
);
PREPARE stmt_institution_requests_credentials_email_status_column FROM @sql_institution_requests_credentials_email_status_column;
EXECUTE stmt_institution_requests_credentials_email_status_column;
DEALLOCATE PREPARE stmt_institution_requests_credentials_email_status_column;

SET @sql_institution_requests_credentials_emailed_at_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institution_requests'
        AND COLUMN_NAME = 'credentials_emailed_at'
    ),
    'SELECT 1',
    'ALTER TABLE institution_requests ADD COLUMN credentials_emailed_at DATETIME NULL'
  )
);
PREPARE stmt_institution_requests_credentials_emailed_at_column FROM @sql_institution_requests_credentials_emailed_at_column;
EXECUTE stmt_institution_requests_credentials_emailed_at_column;
DEALLOCATE PREPARE stmt_institution_requests_credentials_emailed_at_column;

SET @sql_institution_requests_approved_institution_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institution_requests'
        AND CONSTRAINT_NAME = 'fk_institution_requests_approved_institution'
    ),
    'SELECT 1',
    'ALTER TABLE institution_requests ADD CONSTRAINT fk_institution_requests_approved_institution FOREIGN KEY (approved_institution_id) REFERENCES institutions(id) ON DELETE SET NULL'
  )
);
PREPARE stmt_institution_requests_approved_institution_fk FROM @sql_institution_requests_approved_institution_fk;
EXECUTE stmt_institution_requests_approved_institution_fk;
DEALLOCATE PREPARE stmt_institution_requests_approved_institution_fk;

SET @sql_join_requests_reviewed_by_institution_id_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institution_join_requests'
        AND COLUMN_NAME = 'reviewed_by_institution_id'
    ),
    'SELECT 1',
    'ALTER TABLE institution_join_requests ADD COLUMN reviewed_by_institution_id BIGINT NULL'
  )
);
PREPARE stmt_join_requests_reviewed_by_institution_id_column FROM @sql_join_requests_reviewed_by_institution_id_column;
EXECUTE stmt_join_requests_reviewed_by_institution_id_column;
DEALLOCATE PREPARE stmt_join_requests_reviewed_by_institution_id_column;

SET @sql_join_requests_reviewed_by_institution_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'institution_join_requests'
        AND CONSTRAINT_NAME = 'fk_join_requests_reviewed_by_institution'
    ),
    'SELECT 1',
    'ALTER TABLE institution_join_requests ADD CONSTRAINT fk_join_requests_reviewed_by_institution FOREIGN KEY (reviewed_by_institution_id) REFERENCES institutions(id) ON DELETE SET NULL'
  )
);
PREPARE stmt_join_requests_reviewed_by_institution_fk FROM @sql_join_requests_reviewed_by_institution_fk;
EXECUTE stmt_join_requests_reviewed_by_institution_fk;
DEALLOCATE PREPARE stmt_join_requests_reviewed_by_institution_fk;

CREATE TABLE IF NOT EXISTS email_logs (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  recipient_email VARCHAR(160) NOT NULL,
  cc_email VARCHAR(160) NULL,
  subject VARCHAR(255) NOT NULL,
  body TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  error_message TEXT NULL,
  related_entity_type VARCHAR(60) NULL,
  related_entity_id BIGINT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  sent_at DATETIME NULL,
  INDEX idx_email_logs_recipient_created (recipient_email, created_at),
  INDEX idx_email_logs_status_created (status, created_at)
) ENGINE=InnoDB;