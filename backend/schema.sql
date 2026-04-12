CREATE DATABASE IF NOT EXISTS codemitra;
USE codemitra;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  bio TEXT,
  profile_image VARCHAR(255),
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS institutes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institute_name VARCHAR(180) NOT NULL,
  email VARCHAR(120) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  contact_number VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  website VARCHAR(255),
  institute_code VARCHAR(40) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS bio TEXT,
  ADD COLUMN IF NOT EXISTS profile_image VARCHAR(255);

CREATE TABLE IF NOT EXISTS performance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL UNIQUE,
  great_moves INT NOT NULL DEFAULT 0,
  mistakes INT NOT NULL DEFAULT 0,
  blunders INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  penalty_points INT NOT NULL DEFAULT 0,
  suspicious_attempts INT NOT NULL DEFAULT 0,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_performance_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS practice_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  event_type VARCHAR(60) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_practice_event_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS practice_runs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(120) NOT NULL,
  language VARCHAR(30) NOT NULL,
  code LONGTEXT NOT NULL,
  passed INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL,
  error_message TEXT,
  time_taken_seconds INT NOT NULL DEFAULT 0,
  hints_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_practice_runs_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_practice_runs_user_problem (user_id, problem_id, created_at)
);

CREATE TABLE IF NOT EXISTS problem_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(120) NOT NULL,
  final_code LONGTEXT NOT NULL,
  total_attempts INT NOT NULL DEFAULT 0,
  great_moves INT NOT NULL DEFAULT 0,
  mistakes INT NOT NULL DEFAULT 0,
  blunders INT NOT NULL DEFAULT 0,
  total_passed INT NOT NULL DEFAULT 0,
  total_test_cases INT NOT NULL DEFAULT 0,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  total_time_taken_seconds INT NOT NULL DEFAULT 0,
  total_hints_used INT NOT NULL DEFAULT 0,
  completed TINYINT(1) NOT NULL DEFAULT 1,
  submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_problem_submissions_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_problem_submission_user_problem (user_id, problem_id)
);

CREATE TABLE IF NOT EXISTS problem_progress (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  problem_id VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'not_attempted',
  last_run_at TIMESTAMP NULL DEFAULT NULL,
  completed_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_problem_progress_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_problem_progress_user_problem (user_id, problem_id)
);

CREATE TABLE IF NOT EXISTS tests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  institute_id INT NOT NULL,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  duration INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  allow_multiple_attempts TINYINT(1) NOT NULL DEFAULT 0,
  anti_cheating_enabled TINYINT(1) NOT NULL DEFAULT 0,
  show_results TINYINT(1) NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_tests_institute
    FOREIGN KEY (institute_id)
    REFERENCES institutes(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  problem_id VARCHAR(120) DEFAULT NULL,
  custom_question TEXT,
  difficulty VARCHAR(40) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  pattern VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_questions_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_cases (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  input TEXT NOT NULL,
  expected_output TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_cases_question
    FOREIGN KEY (question_id)
    REFERENCES test_questions(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS test_attempts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  test_id INT NOT NULL,
  user_id INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ongoing',
  tab_switch_count INT NOT NULL DEFAULT 0,
  anti_cheat_flags INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_attempts_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_test_attempts_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  INDEX idx_test_attempts_user_test (user_id, test_id, status)
);

CREATE TABLE IF NOT EXISTS test_submissions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL,
  question_id INT NOT NULL,
  code LONGTEXT NOT NULL,
  language VARCHAR(30) NOT NULL,
  passed INT NOT NULL DEFAULT 0,
  total INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_submissions_attempt
    FOREIGN KEY (attempt_id)
    REFERENCES test_attempts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_test_submissions_question
    FOREIGN KEY (question_id)
    REFERENCES test_questions(id)
    ON DELETE CASCADE,
  UNIQUE KEY uk_test_submission_attempt_question (attempt_id, question_id)
);

CREATE TABLE IF NOT EXISTS test_reports (
  id INT AUTO_INCREMENT PRIMARY KEY,
  attempt_id INT NOT NULL UNIQUE,
  user_id INT NOT NULL,
  test_id INT NOT NULL,
  accuracy DECIMAL(5,2) NOT NULL DEFAULT 0,
  score INT NOT NULL DEFAULT 0,
  great_moves INT NOT NULL DEFAULT 0,
  mistakes INT NOT NULL DEFAULT 0,
  blunders INT NOT NULL DEFAULT 0,
  time_taken INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_test_reports_attempt
    FOREIGN KEY (attempt_id)
    REFERENCES test_attempts(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_test_reports_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_test_reports_test
    FOREIGN KEY (test_id)
    REFERENCES tests(id)
    ON DELETE CASCADE
);
