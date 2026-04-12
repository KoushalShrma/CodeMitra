-- Harden admin access model: no public self-registration, explicit admin permissions.

SET @sql_admin_users_username_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'admin_users'
        AND COLUMN_NAME = 'username'
    ),
    'SELECT 1',
    'ALTER TABLE admin_users ADD COLUMN username VARCHAR(80) NULL'
  )
);
PREPARE stmt_admin_users_username_column FROM @sql_admin_users_username_column;
EXECUTE stmt_admin_users_username_column;
DEALLOCATE PREPARE stmt_admin_users_username_column;

UPDATE admin_users
SET username = CONCAT('admin', id)
WHERE username IS NULL OR TRIM(username) = '';

SET @sql_admin_users_can_add_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'admin_users'
        AND COLUMN_NAME = 'can_add_admins'
    ),
    'SELECT 1',
    'ALTER TABLE admin_users ADD COLUMN can_add_admins TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_admin_users_can_add_column FROM @sql_admin_users_can_add_column;
EXECUTE stmt_admin_users_can_add_column;
DEALLOCATE PREPARE stmt_admin_users_can_add_column;

SET @sql_admin_users_can_approve_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'admin_users'
        AND COLUMN_NAME = 'can_approve_institutions'
    ),
    'SELECT 1',
    'ALTER TABLE admin_users ADD COLUMN can_approve_institutions TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_admin_users_can_approve_column FROM @sql_admin_users_can_approve_column;
EXECUTE stmt_admin_users_can_approve_column;
DEALLOCATE PREPARE stmt_admin_users_can_approve_column;

SET @sql_admin_users_created_by_column = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'admin_users'
        AND COLUMN_NAME = 'created_by_admin_id'
    ),
    'SELECT 1',
    'ALTER TABLE admin_users ADD COLUMN created_by_admin_id BIGINT NULL'
  )
);
PREPARE stmt_admin_users_created_by_column FROM @sql_admin_users_created_by_column;
EXECUTE stmt_admin_users_created_by_column;
DEALLOCATE PREPARE stmt_admin_users_created_by_column;

UPDATE admin_users
SET can_add_admins = 1,
    can_approve_institutions = 1
WHERE UPPER(role) = 'SUPER_ADMIN';

SET @sql_admin_users_username_unique = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.STATISTICS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'admin_users'
        AND INDEX_NAME = 'uk_admin_users_username'
    ),
    'SELECT 1',
    'CREATE UNIQUE INDEX uk_admin_users_username ON admin_users (username)'
  )
);
PREPARE stmt_admin_users_username_unique FROM @sql_admin_users_username_unique;
EXECUTE stmt_admin_users_username_unique;
DEALLOCATE PREPARE stmt_admin_users_username_unique;

SET @sql_admin_users_created_by_fk = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.REFERENTIAL_CONSTRAINTS
      WHERE CONSTRAINT_SCHEMA = DATABASE()
        AND TABLE_NAME = 'admin_users'
        AND CONSTRAINT_NAME = 'fk_admin_users_created_by'
    ),
    'SELECT 1',
    'ALTER TABLE admin_users ADD CONSTRAINT fk_admin_users_created_by FOREIGN KEY (created_by_admin_id) REFERENCES admin_users(id) ON DELETE SET NULL'
  )
);
PREPARE stmt_admin_users_created_by_fk FROM @sql_admin_users_created_by_fk;
EXECUTE stmt_admin_users_created_by_fk;
DEALLOCATE PREPARE stmt_admin_users_created_by_fk;
