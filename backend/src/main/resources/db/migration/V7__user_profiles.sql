-- Persistent user profile preferences restored across sessions and devices.

CREATE TABLE IF NOT EXISTS user_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  theme_mode VARCHAR(20) NOT NULL DEFAULT 'dark',
  editor_font_size INT NOT NULL DEFAULT 15,
  sidebar_collapsed TINYINT(1) NOT NULL DEFAULT 0,
  preferred_language VARCHAR(30) NOT NULL DEFAULT 'javascript',
  vim_mode TINYINT(1) NOT NULL DEFAULT 0,
  active_institution_id VARCHAR(64),
  locale VARCHAR(16),
  timezone VARCHAR(64),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_user_profiles_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

INSERT INTO user_profiles (user_id)
SELECT users.id
FROM users
LEFT JOIN user_profiles ON user_profiles.user_id = users.id
WHERE user_profiles.user_id IS NULL;
