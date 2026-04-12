-- Analytics stale markers and buffering support columns.

SET @sql_user_analytics_stale = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_analytics'
        AND COLUMN_NAME = 'stale'
    ),
    'SELECT 1',
    'ALTER TABLE user_analytics ADD COLUMN stale TINYINT(1) NOT NULL DEFAULT 0'
  )
);
PREPARE stmt_user_analytics_stale FROM @sql_user_analytics_stale;
EXECUTE stmt_user_analytics_stale;
DEALLOCATE PREPARE stmt_user_analytics_stale;

SET @sql_user_analytics_stale_since = (
  SELECT IF(
    EXISTS(
      SELECT 1
      FROM information_schema.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'user_analytics'
        AND COLUMN_NAME = 'stale_since'
    ),
    'SELECT 1',
    'ALTER TABLE user_analytics ADD COLUMN stale_since DATETIME NULL'
  )
);
PREPARE stmt_user_analytics_stale_since FROM @sql_user_analytics_stale_since;
EXECUTE stmt_user_analytics_stale_since;
DEALLOCATE PREPARE stmt_user_analytics_stale_since;

CREATE INDEX idx_user_analytics_stale ON user_analytics (stale);
