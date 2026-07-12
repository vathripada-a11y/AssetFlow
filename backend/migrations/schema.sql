-- AssetFlow MySQL Schema
-- Run: mysql -u root -p < schema.sql

CREATE DATABASE IF NOT EXISTS assetflow;
USE assetflow;

-- ===== MASTER DATA =====

CREATE TABLE departments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  head_employee_id INT NULL,
  parent_department_id INT NULL,
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_department_id) REFERENCES departments(id)
);

CREATE TABLE asset_categories (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  custom_fields JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE employees (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  department_id INT NULL,
  role ENUM('employee','department_head','asset_manager','admin') DEFAULT 'employee',
  status ENUM('active','inactive') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

ALTER TABLE departments
  ADD CONSTRAINT fk_dept_head FOREIGN KEY (head_employee_id) REFERENCES employees(id);

-- ===== TRANSACTIONAL DATA =====

CREATE TABLE assets (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_tag VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(150) NOT NULL,
  category_id INT NULL,
  serial_number VARCHAR(100),
  acquisition_date DATE,
  acquisition_cost DECIMAL(12,2),
  `condition` ENUM('new','good','fair','poor') DEFAULT 'good',
  location VARCHAR(150),
  is_bookable BOOLEAN DEFAULT FALSE,
  status ENUM('available','allocated','reserved','under_maintenance','lost','retired','disposed') DEFAULT 'available',
  photo_url VARCHAR(255),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES asset_categories(id)
);

CREATE TABLE allocations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  employee_id INT NULL,
  department_id INT NULL,
  allocated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expected_return_date DATE NULL,
  returned_at DATETIME NULL,
  return_condition_notes TEXT NULL,
  status ENUM('active','returned','overdue') DEFAULT 'active',
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id),
  FOREIGN KEY (department_id) REFERENCES departments(id)
);

CREATE TABLE transfer_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  requested_by INT NOT NULL,
  current_holder_id INT NULL,
  status ENUM('requested','approved','rejected','reallocated') DEFAULT 'requested',
  approved_by INT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (requested_by) REFERENCES employees(id),
  FOREIGN KEY (current_holder_id) REFERENCES employees(id),
  FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  booked_by INT NOT NULL,
  start_time DATETIME NOT NULL,
  end_time DATETIME NOT NULL,
  status ENUM('upcoming','ongoing','completed','cancelled') DEFAULT 'upcoming',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (booked_by) REFERENCES employees(id)
);

CREATE TABLE maintenance_requests (
  id INT AUTO_INCREMENT PRIMARY KEY,
  asset_id INT NOT NULL,
  raised_by INT NOT NULL,
  issue_description TEXT,
  priority ENUM('low','medium','high') DEFAULT 'medium',
  photo_url VARCHAR(255),
  status ENUM('pending','approved','rejected','technician_assigned','in_progress','resolved') DEFAULT 'pending',
  approved_by INT NULL,
  technician_name VARCHAR(100),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  resolved_at DATETIME NULL,
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (raised_by) REFERENCES employees(id),
  FOREIGN KEY (approved_by) REFERENCES employees(id)
);

CREATE TABLE audit_cycles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  scope_department_id INT NULL,
  scope_location VARCHAR(150) NULL,
  start_date DATE,
  end_date DATE,
  status ENUM('open','closed') DEFAULT 'open',
  created_by INT NOT NULL,
  FOREIGN KEY (scope_department_id) REFERENCES departments(id),
  FOREIGN KEY (created_by) REFERENCES employees(id)
);

CREATE TABLE audit_cycle_auditors (
  audit_cycle_id INT NOT NULL,
  employee_id INT NOT NULL,
  PRIMARY KEY (audit_cycle_id, employee_id),
  FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id),
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE audit_findings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  audit_cycle_id INT NOT NULL,
  asset_id INT NOT NULL,
  result ENUM('verified','missing','damaged') NOT NULL,
  notes TEXT,
  recorded_by INT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_cycle_id) REFERENCES audit_cycles(id),
  FOREIGN KEY (asset_id) REFERENCES assets(id),
  FOREIGN KEY (recorded_by) REFERENCES employees(id)
);

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  type VARCHAR(50),
  message VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

CREATE TABLE activity_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  employee_id INT NOT NULL,
  action VARCHAR(150),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id)
);

-- Seed: one bootstrap admin so someone can log in and promote others.
-- Password is 'Admin@123' hashed with bcrypt (10 rounds) - CHANGE after first login.
-- Generate your own hash if this doesn't match your bcrypt version; see backend README.
INSERT INTO departments (name, status) VALUES ('Administration', 'active');
