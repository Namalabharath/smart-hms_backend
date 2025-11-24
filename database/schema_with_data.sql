-- ============================================
-- HOSPITAL MANAGEMENT SYSTEM - WITH TEST DATA
-- ============================================

-- Create database
DROP DATABASE IF EXISTS hospital_management_system;
CREATE DATABASE hospital_management_system;
USE hospital_management_system;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    role ENUM('admin', 'doctor', 'nurse', 'pharmacist', 'lab_technician', 'receptionist', 'patient') NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    auth_type ENUM('zkp', 'traditional') DEFAULT 'zkp',
    password_hash VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (role),
    INDEX (username),
    UNIQUE KEY unique_email (email)
);

-- ============================================
-- ZKP CREDENTIALS TABLE
-- ============================================
CREATE TABLE zkp_credentials (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    public_key TEXT NOT NULL,
    base TEXT NOT NULL,
    prime TEXT NOT NULL,
    secret_encrypted TEXT NOT NULL,
    salt VARCHAR(255) NOT NULL,
    iv VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY (user_id)
);

-- ============================================
-- ZKP SESSIONS TABLE
-- ============================================
CREATE TABLE zkp_sessions (
    id VARCHAR(100) PRIMARY KEY,
    user_id INT NOT NULL,
    t_value TEXT NOT NULL,
    challenge TEXT NOT NULL,
    attempts INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (expires_at)
);

-- ============================================
-- PATIENTS TABLE
-- ============================================
CREATE TABLE patients (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    date_of_birth DATE,
    gender ENUM('Male', 'Female', 'Other'),
    blood_group VARCHAR(10),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    state VARCHAR(50),
    postal_code VARCHAR(10),
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    medical_history TEXT,
    allergies TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id)
);

-- ============================================
-- DOCTORS TABLE
-- ============================================
CREATE TABLE doctors (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    specialization VARCHAR(100),
    license_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    phone_extension VARCHAR(10),
    available_slots INT DEFAULT 10,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (specialization),
    INDEX (department)
);

-- ============================================
-- NURSES TABLE
-- ============================================
CREATE TABLE nurses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    license_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    shift VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (department)
);

-- ============================================
-- PHARMACISTS TABLE
-- ============================================
CREATE TABLE pharmacists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    license_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- LAB TECHNICIANS TABLE
-- ============================================
CREATE TABLE lab_technicians (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    license_number VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- RECEPTIONISTS TABLE
-- ============================================
CREATE TABLE receptionists (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL UNIQUE,
    department VARCHAR(100),
    phone_extension VARCHAR(10),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- APPOINTMENTS TABLE
-- ============================================
CREATE TABLE appointments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_date DATETIME NOT NULL,
    reason TEXT,
    status ENUM('scheduled', 'completed', 'cancelled', 'no_show') DEFAULT 'scheduled',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX (patient_id),
    INDEX (doctor_id),
    INDEX (appointment_date)
);

-- ============================================
-- DIAGNOSES TABLE
-- ============================================
CREATE TABLE diagnoses (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    appointment_id INT,
    diagnosis_name VARCHAR(255) NOT NULL,
    icd_code VARCHAR(20),
    severity ENUM('mild', 'moderate', 'severe', 'critical') DEFAULT 'moderate',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (appointment_id) REFERENCES appointments(id) ON DELETE SET NULL,
    INDEX (patient_id),
    INDEX (doctor_id)
);

-- ============================================
-- VITAL SIGNS TABLE
-- ============================================
CREATE TABLE vital_signs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    nurse_id INT,
    temperature DECIMAL(5,2),
    heart_rate INT,
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    oxygen_saturation DECIMAL(5,2),
    glucose_level DECIMAL(7,2),
    weight DECIMAL(7,2),
    height DECIMAL(5,2),
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (nurse_id) REFERENCES nurses(id) ON DELETE SET NULL,
    INDEX (patient_id),
    INDEX (recorded_at)
);

-- ============================================
-- MEDICATIONS TABLE
-- ============================================
CREATE TABLE medications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    strength VARCHAR(50),
    form VARCHAR(50),
    stock_quantity INT,
    reorder_level INT DEFAULT 50,
    expiry_date DATE,
    cost DECIMAL(10,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX (name)
);

-- ============================================
-- PRESCRIPTIONS TABLE
-- ============================================
CREATE TABLE prescriptions (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    medication_id INT NOT NULL,
    dosage VARCHAR(100),
    frequency VARCHAR(100),
    duration VARCHAR(50),
    quantity INT,
    status ENUM('pending', 'dispensed', 'cancelled') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    FOREIGN KEY (medication_id) REFERENCES medications(id) ON DELETE CASCADE,
    INDEX (patient_id),
    INDEX (status)
);

-- ============================================
-- LAB REQUESTS TABLE
-- ============================================
CREATE TABLE lab_requests (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    doctor_id INT NOT NULL,
    test_name VARCHAR(255) NOT NULL,
    status ENUM('requested', 'collected', 'processing', 'completed', 'cancelled') DEFAULT 'requested',
    sample_collection_date DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE CASCADE,
    INDEX (patient_id),
    INDEX (status)
);

-- ============================================
-- LAB RESULTS TABLE
-- ============================================
CREATE TABLE lab_results (
    id INT PRIMARY KEY AUTO_INCREMENT,
    lab_request_id INT NOT NULL,
    result_status ENUM('normal', 'abnormal', 'critical') DEFAULT 'normal',
    result_value VARCHAR(255),
    reference_range VARCHAR(255),
    unit VARCHAR(50),
    report_file_path VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (lab_request_id) REFERENCES lab_requests(id) ON DELETE CASCADE,
    INDEX (lab_request_id)
);

-- ============================================
-- MEDICATION ADMINISTRATION TABLE
-- ============================================
CREATE TABLE medication_administration (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    prescription_id INT NOT NULL,
    nurse_id INT NOT NULL,
    time_administered DATETIME,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (prescription_id) REFERENCES prescriptions(id) ON DELETE CASCADE,
    FOREIGN KEY (nurse_id) REFERENCES nurses(id) ON DELETE CASCADE,
    INDEX (patient_id),
    INDEX (time_administered)
);

-- ============================================
-- DAILY PROGRESS TABLE
-- ============================================
CREATE TABLE daily_progress (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    nurse_id INT NOT NULL,
    progress_date DATE,
    shift VARCHAR(20),
    appetite VARCHAR(50),
    sleep_hours DECIMAL(3,1),
    mood VARCHAR(50),
    pain_level INT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (nurse_id) REFERENCES nurses(id) ON DELETE CASCADE,
    INDEX (patient_id),
    INDEX (progress_date)
);

-- ============================================
-- PATIENT DOCUMENTS TABLE
-- ============================================
CREATE TABLE patient_documents (
    id INT PRIMARY KEY AUTO_INCREMENT,
    patient_id INT NOT NULL,
    uploaded_by INT NOT NULL,
    document_type VARCHAR(100),
    file_name VARCHAR(255),
    file_path VARCHAR(255),
    file_size INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (patient_id)
);

-- ============================================
-- STAFF ATTENDANCE TABLE
-- ============================================
CREATE TABLE staff_attendance (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    attendance_date DATE,
    status ENUM('present', 'absent', 'leave', 'half-day') DEFAULT 'present',
    check_in_time TIME,
    check_out_time TIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX (user_id),
    INDEX (attendance_date)
);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================
CREATE TABLE audit_log (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id INT,
    old_value TEXT,
    new_value TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX (user_id),
    INDEX (created_at)
);

-- ============================================
-- INSERT TEST DATA
-- ============================================

-- Insert Admin User
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('admin', 'admin@hospital.com', 'admin', 'System', 'Administrator', 'zkp');

-- Insert Doctor Users
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('dr_smith', 'smith@hospital.com', 'doctor', 'Dr. John', 'Smith', 'zkp'),
('dr_jones', 'jones@hospital.com', 'doctor', 'Dr. Mary', 'Jones', 'zkp');

-- Insert Nurse Users
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('nurse_sarah', 'sarah@hospital.com', 'nurse', 'Sarah', 'Johnson', 'zkp'),
('nurse_mike', 'mike@hospital.com', 'nurse', 'Mike', 'Williams', 'zkp');

-- Insert Pharmacist
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('pharmacist_bob', 'bob@hospital.com', 'pharmacist', 'Bob', 'Brown', 'zkp');

-- Insert Lab Technician
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('lab_tech_alice', 'alice@hospital.com', 'lab_technician', 'Alice', 'Davis', 'zkp');

-- Insert Receptionist
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('receptionist_emma', 'emma@hospital.com', 'receptionist', 'Emma', 'Wilson', 'zkp');

-- Insert Patient Users
INSERT INTO users (username, email, role, first_name, last_name, auth_type) VALUES
('patient_john', 'john.patient@hospital.com', 'patient', 'John', 'Doe', 'zkp'),
('patient_jane', 'jane.patient@hospital.com', 'patient', 'Jane', 'Smith', 'zkp'),
('patient_bob', 'bob.patient@hospital.com', 'patient', 'Bob', 'Johnson', 'zkp');

-- Insert Doctor Details
INSERT INTO doctors (user_id, specialization, license_number, department, available_slots) VALUES
(2, 'Cardiology', 'LIC001', 'Cardiology', 10),
(3, 'Pediatrics', 'LIC002', 'Pediatrics', 8);

-- Insert Nurse Details
INSERT INTO nurses (user_id, license_number, department, shift) VALUES
(4, 'NURSE001', 'ICU', 'Day'),
(5, 'NURSE002', 'General Ward', 'Night');

-- Insert Pharmacist Details
INSERT INTO pharmacists (user_id, license_number, department) VALUES
(6, 'PHARM001', 'Pharmacy');

-- Insert Lab Technician Details
INSERT INTO lab_technicians (user_id, license_number, department) VALUES
(7, 'LAB001', 'Laboratory');

-- Insert Receptionist Details
INSERT INTO receptionists (user_id, department, phone_extension) VALUES
(8, 'Front Desk', '100');

-- Insert Patient Details
INSERT INTO patients (user_id, date_of_birth, gender, blood_group, phone, address, city, state, postal_code, emergency_contact_name, emergency_contact_phone, medical_history, allergies) VALUES
(9, '1985-05-15', 'Male', 'O+', '555-0101', '123 Main St', 'New York', 'NY', '10001', 'Jane Doe', '555-0102', 'Hypertension', 'Penicillin'),
(10, '1990-08-22', 'Female', 'A+', '555-0103', '456 Oak Ave', 'Boston', 'MA', '02101', 'John Smith', '555-0104', 'Diabetes', 'Shellfish'),
(11, '1980-03-10', 'Male', 'B+', '555-0105', '789 Pine Rd', 'Chicago', 'IL', '60601', 'Alice Johnson', '555-0106', 'None', 'None');

-- Insert Medications
INSERT INTO medications (name, strength, form, stock_quantity, reorder_level, expiry_date, cost) VALUES
('Aspirin', '500mg', 'Tablet', 1000, 50, '2026-12-31', 0.50),
('Amoxicillin', '250mg', 'Capsule', 500, 100, '2026-06-30', 2.00),
('Metformin', '500mg', 'Tablet', 800, 100, '2025-12-31', 1.50),
('Lisinopril', '10mg', 'Tablet', 600, 50, '2026-03-31', 2.50),
('Ibuprofen', '200mg', 'Tablet', 1200, 100, '2026-09-30', 0.75);

-- Insert Appointments
INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status, notes) VALUES
(1, 1, '2025-11-25 10:00:00', 'Regular Checkup', 'scheduled', 'Annual health examination'),
(2, 1, '2025-11-26 14:00:00', 'Heart Palpitation', 'completed', 'Patient reported chest pain'),
(3, 2, '2025-11-27 09:30:00', 'Pediatric Checkup', 'scheduled', 'Child wellness visit');

-- Insert Diagnoses
INSERT INTO diagnoses (patient_id, doctor_id, appointment_id, diagnosis_name, icd_code, severity, description) VALUES
(2, 1, 2, 'Hypertension', 'I10', 'moderate', 'Patient diagnosed with Stage 2 hypertension'),
(3, 2, 3, 'Upper Respiratory Infection', 'J06.9', 'mild', 'Common cold symptoms');

-- Insert Vital Signs
INSERT INTO vital_signs (patient_id, nurse_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation, glucose_level, weight, height, recorded_at) VALUES
(1, 1, 98.6, 72, 120, 80, 98.5, 100, 75, 180, NOW()),
(2, 1, 98.8, 75, 135, 85, 98.2, 105, 70, 175, NOW()),
(3, 2, 98.4, 85, 110, 70, 99.0, 95, 60, 165, NOW());

-- Insert Prescriptions
INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration, quantity, status, notes) VALUES
(1, 1, 4, '10mg', 'Once daily', '30 days', 30, 'pending', 'Take in the morning'),
(2, 1, 1, '500mg', 'Twice daily', '7 days', 14, 'dispensed', 'After meals'),
(3, 2, 5, '200mg', 'Every 4-6 hours', '5 days', 12, 'pending', 'As needed for fever');

-- Insert Lab Requests
INSERT INTO lab_requests (patient_id, doctor_id, test_name, status, sample_collection_date, notes) VALUES
(1, 1, 'Blood Test', 'completed', '2025-11-23 08:00:00', 'Complete blood count'),
(2, 1, 'ECG', 'processing', '2025-11-24 09:00:00', 'Electrocardiogram for heart check'),
(3, 2, 'Blood Test', 'requested', NULL, 'General health screening');

-- Insert Lab Results
INSERT INTO lab_results (lab_request_id, result_status, result_value, reference_range, unit, notes) VALUES
(1, 'normal', '7.8', '4.5-11.0', 'K/uL', 'White blood cell count normal'),
(2, 'abnormal', '125', '60-100', 'bpm', 'Heart rate slightly elevated');

-- Insert Medication Administration
INSERT INTO medication_administration (patient_id, prescription_id, nurse_id, time_administered, notes) VALUES
(1, 2, 1, NOW(), 'Patient took medication without issues');

-- Insert Daily Progress
INSERT INTO daily_progress (patient_id, nurse_id, progress_date, shift, appetite, sleep_hours, mood, pain_level, notes) VALUES
(1, 1, CURDATE(), 'Day', 'Good', 8.0, 'Happy', 0, 'Patient doing well'),
(2, 1, CURDATE(), 'Day', 'Fair', 6.5, 'Anxious', 3, 'Slight discomfort'),
(3, 2, CURDATE(), 'Night', 'Good', 7.5, 'Good', 1, 'Resting well');

-- Insert Staff Attendance
INSERT INTO staff_attendance (user_id, attendance_date, status, check_in_time, check_out_time) VALUES
(2, CURDATE(), 'present', '08:00:00', '17:00:00'),
(4, CURDATE(), 'present', '08:30:00', '16:30:00'),
(6, CURDATE(), 'present', '09:00:00', '17:30:00');

-- ============================================
-- SUMMARY OF TABLES CREATED
-- ============================================
-- Total Tables: 18
-- 1. users - All staff and patients
-- 2. zkp_credentials - ZKP authentication data
-- 3. zkp_sessions - Active ZKP sessions
-- 4. patients - Patient information
-- 5. doctors - Doctor information
-- 6. nurses - Nurse information
-- 7. pharmacists - Pharmacist information
-- 8. lab_technicians - Lab technician information
-- 9. receptionists - Receptionist information
-- 10. appointments - Patient appointments
-- 11. diagnoses - Medical diagnoses
-- 12. vital_signs - Patient vital signs
-- 13. medications - Available medications
-- 14. prescriptions - Patient prescriptions
-- 15. lab_requests - Lab test requests
-- 16. lab_results - Lab test results
-- 17. medication_administration - Drug administration records
-- 18. daily_progress - Patient daily progress notes
-- 19. patient_documents - Document storage
-- 20. staff_attendance - Staff attendance tracking
-- 21. audit_log - System audit trail

-- ============================================
-- TEST DATA SUMMARY
-- ============================================
-- Users Created: 11 (1 admin, 2 doctors, 2 nurses, 1 pharmacist, 1 lab tech, 1 receptionist, 3 patients)
-- Doctors: 2 with specializations
-- Patients: 3 with medical history
-- Medications: 5 different medications in stock
-- Appointments: 3 appointments
-- Diagnoses: 2 diagnoses recorded
-- Lab Requests: 3 lab requests
-- Vital Signs: 3 patient records
-- Prescriptions: 3 prescriptions
-- Daily Progress: 3 progress notes
