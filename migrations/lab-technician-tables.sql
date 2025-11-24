-- Lab Technician Tables Migration
-- This script creates the necessary tables for lab technician functionality

-- Create patient_samples table if not exists
CREATE TABLE IF NOT EXISTS patient_samples (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT NOT NULL,
  sample_type VARCHAR(50) NOT NULL COMMENT 'blood, urine, stool, saliva, tissue, other',
  collection_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' COMMENT 'pending, collected, processing, analyzed',
  notes TEXT,
  collected_by_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
  FOREIGN KEY (collected_by_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_patient_id (patient_id),
  INDEX idx_status (status),
  INDEX idx_collection_date (collection_date)
);

-- Create test_results table if not exists
CREATE TABLE IF NOT EXISTS test_results (
  id INT AUTO_INCREMENT PRIMARY KEY,
  lab_request_id INT NOT NULL,
  test_name VARCHAR(100) NOT NULL,
  result VARCHAR(255),
  reference_range VARCHAR(100),
  unit VARCHAR(50),
  status VARCHAR(50) NOT NULL DEFAULT 'normal' COMMENT 'normal, abnormal, critical',
  remarks TEXT,
  report_file VARCHAR(255),
  uploaded_by_id INT,
  uploaded_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lab_request_id) REFERENCES lab_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_lab_request_id (lab_request_id),
  INDEX idx_status (status),
  INDEX idx_uploaded_date (uploaded_date)
);

