-- Create patient_documents table if it doesn't exist
-- Run this SQL script in your MySQL database

USE hospital_management_system;

CREATE TABLE IF NOT EXISTS patient_documents (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    document_type VARCHAR(100) DEFAULT 'general',
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    description TEXT,
    uploaded_by INT NOT NULL,
    upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_upload_date (upload_date)
);

-- Verify the table was created
SELECT 'patient_documents table created successfully!' AS message;
DESCRIBE patient_documents;
