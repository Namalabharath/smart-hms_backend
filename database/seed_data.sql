-- =====================================================
-- HOSPITAL MANAGEMENT SYSTEM - SEED DATA
-- =====================================================

-- Clear existing data (be careful with this!)
DELETE FROM staff_absences;
DELETE FROM appointments;
DELETE FROM prescriptions;
DELETE FROM diagnoses;
DELETE FROM vital_signs;
DELETE FROM progress_notes;
DELETE FROM patient_documents;
DELETE FROM lab_technicians;
DELETE FROM pharmacists;
DELETE FROM nurses;
DELETE FROM doctors;
DELETE FROM receptionists;
DELETE FROM patients;
DELETE FROM users;
DELETE FROM zkp_credentials;

-- =====================================================
-- 1. USERS - ADMIN (1)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('admin_raj', 'admin@hospital.local', 'admin', 'Raj', 'Kumar', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 2. USERS - RECEPTIONIST (2)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('receptionist_priya', 'priya@hospital.local', 'receptionist', 'Priya', 'Singh', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('receptionist_john', 'john@hospital.local', 'receptionist', 'John', 'Doe', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 3. USERS - DOCTOR (3)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('doctor_smith', 'smith@hospital.local', 'doctor', 'Dr. James', 'Smith', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('doctor_sharma', 'sharma@hospital.local', 'doctor', 'Dr. Amit', 'Sharma', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('doctor_patel', 'patel@hospital.local', 'doctor', 'Dr. Rajesh', 'Patel', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 4. USERS - NURSE (3)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('nurse_sarah', 'sarah@hospital.local', 'nurse', 'Sarah', 'Johnson', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('nurse_maria', 'maria@hospital.local', 'nurse', 'Maria', 'Garcia', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('nurse_emily', 'emily@hospital.local', 'nurse', 'Emily', 'Brown', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 5. USERS - PHARMACIST (2)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('pharmacist_alex', 'alex@hospital.local', 'pharmacist', 'Alex', 'Wilson', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('pharmacist_lisa', 'lisa@hospital.local', 'pharmacist', 'Lisa', 'Martinez', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 6. USERS - LAB TECHNICIAN (2)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('lab_tech_david', 'david@hospital.local', 'lab_technician', 'David', 'Lee', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('lab_tech_anna', 'anna@hospital.local', 'lab_technician', 'Anna', 'White', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 7. USERS - PATIENT (10)
-- =====================================================
INSERT INTO users (username, email, role, first_name, last_name, password_hash, auth_type, is_active) VALUES
('patient_robert', 'robert@hospital.local', 'patient', 'Robert', 'Anderson', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_jennifer', 'jennifer@hospital.local', 'patient', 'Jennifer', 'Taylor', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_michael', 'michael@hospital.local', 'patient', 'Michael', 'Thomas', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_susan', 'susan@hospital.local', 'patient', 'Susan', 'Jackson', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_james', 'james@hospital.local', 'patient', 'James', 'White', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_mary', 'mary@hospital.local', 'patient', 'Mary', 'Harris', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_william', 'william@hospital.local', 'patient', 'William', 'Martin', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_patricia', 'patricia@hospital.local', 'patient', 'Patricia', 'Thompson', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_charles', 'charles@hospital.local', 'patient', 'Charles', 'Garcia', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE),
('patient_linda', 'linda@hospital.local', 'patient', 'Linda', 'Rodriguez', 'e8e80da14a4b1ffd39f0eb3f69b5f0a55ddb5b9054cf1f27b866bf4ead8acf3', 'simple_hash', TRUE);

-- =====================================================
-- 8. RECEPTIONISTS (Create role-specific records)
-- =====================================================
INSERT INTO receptionists (user_id, department, phone_extension) VALUES
(2, 'Front Desk', '101'),
(3, 'Front Desk', '102');

-- =====================================================
-- 9. DOCTORS (Create role-specific records)
-- =====================================================
INSERT INTO doctors (user_id, specialization, available_slots, license_number) VALUES
(4, 'Cardiology', 5, 'DOC-001-2025'),
(5, 'Neurology', 8, 'DOC-002-2025'),
(6, 'Orthopedics', 6, 'DOC-003-2025');

-- =====================================================
-- 10. NURSES (Create role-specific records)
-- =====================================================
INSERT INTO nurses (user_id, license_number, department, shift) VALUES
(7, 'NRS-001-2025', 'General Ward', 'Morning'),
(8, 'NRS-002-2025', 'ICU', 'Evening'),
(9, 'NRS-003-2025', 'Emergency', 'Night');

-- =====================================================
-- 11. PHARMACISTS (Create role-specific records)
-- =====================================================
INSERT INTO pharmacists (user_id, license_number, department, shift) VALUES
(10, 'PHM-001-2025', 'Pharmacy', 'Morning'),
(11, 'PHM-002-2025', 'Pharmacy', 'Evening');

-- =====================================================
-- 12. LAB TECHNICIANS (Create role-specific records)
-- =====================================================
INSERT INTO lab_technicians (user_id, license_number, department, shift) VALUES
(12, 'LAB-001-2025', 'Laboratory', 'Morning'),
(13, 'LAB-002-2025', 'Laboratory', 'Evening');

-- =====================================================
-- 13. PATIENTS (Create role-specific records with details)
-- =====================================================
INSERT INTO patients (user_id, date_of_birth, gender, blood_group, phone, address, city, postal_code, emergency_contact_name, emergency_contact_phone, medical_history, allergies) VALUES
(14, '1975-03-15', 'Male', 'O+', '555-0001', '123 Main St', 'New York', '10001', 'Sarah Anderson', '555-0001', 'Diabetes, Hypertension', 'Penicillin'),
(15, '1982-07-22', 'Female', 'A+', '555-0002', '456 Oak Ave', 'Boston', '02101', 'John Taylor', '555-0002', 'Asthma, Allergies', 'Shellfish'),
(16, '1968-11-08', 'Male', 'B+', '555-0003', '789 Pine Rd', 'Chicago', '60601', 'Emily Thomas', '555-0003', 'Heart Condition', 'None'),
(17, '1990-05-14', 'Female', 'AB+', '555-0004', '321 Elm St', 'Houston', '77001', 'Tom Jackson', '555-0004', 'None', 'Latex'),
(18, '1955-09-30', 'Male', 'O+', '555-0005', '654 Maple Dr', 'Phoenix', '85001', 'Linda White', '555-0005', 'Arthritis, Hypertension', 'Aspirin'),
(19, '1978-12-03', 'Female', 'A+', '555-0006', '987 Cedar Ln', 'Philadelphia', '19101', 'Mike Harris', '555-0006', 'Thyroid Issue', 'Sulfa drugs'),
(20, '1988-02-18', 'Male', 'B+', '555-0007', '147 Birch Ct', 'San Antonio', '78201', 'Rebecca Martin', '555-0007', 'None', 'None'),
(21, '1970-08-25', 'Female', 'O+', '555-0008', '258 Spruce Way', 'San Diego', '92101', 'George Thompson', '555-0008', 'High Cholesterol', 'NSAIDs'),
(22, '1985-06-11', 'Male', 'AB-', '555-0009', '369 Walnut Blvd', 'Dallas', '75201', 'Victoria Garcia', '555-0009', 'Migraine', 'Codeine'),
(23, '1992-01-27', 'Female', 'A-', '555-0010', '741 Hickory St', 'San Jose', '95101', 'Aaron Rodriguez', '555-0010', 'None', 'Peanuts');

-- =====================================================
-- 14. APPOINTMENTS (Mix of statuses)
-- =====================================================
INSERT INTO appointments (patient_id, doctor_id, appointment_date, reason, status, notes) VALUES
(1, 1, '2025-11-25 09:00:00', 'Routine Checkup', 'scheduled', 'Follow-up on blood pressure'),
(2, 2, '2025-11-25 10:30:00', 'Headache Consultation', 'scheduled', 'Severe migraines for 2 weeks'),
(3, 3, '2025-11-25 14:00:00', 'Knee Pain Assessment', 'completed', 'Post-surgery follow-up'),
(4, 1, '2025-11-26 11:00:00', 'Annual Physical', 'scheduled', 'Regular health checkup'),
(5, 2, '2025-11-26 15:30:00', 'Neurological Exam', 'scheduled', 'Dizziness complaints'),
(6, 1, '2025-11-27 09:30:00', 'Thyroid Function Test', 'cancelled', 'Patient rescheduled'),
(7, 3, '2025-11-27 13:00:00', 'Back Pain Consultation', 'scheduled', 'Lower back pain'),
(8, 1, '2025-11-28 10:00:00', 'Follow-up Visit', 'no_show', 'Patient did not attend'),
(9, 2, '2025-11-28 16:00:00', 'Brain Scan Follow-up', 'scheduled', 'Review scan results'),
(10, 3, '2025-11-29 11:30:00', 'Post-Fracture Check', 'completed', 'Arm fracture healing progress');

-- =====================================================
-- 15. VITAL SIGNS (Multiple per patient)
-- =====================================================
INSERT INTO vital_signs (patient_id, recorded_by, blood_pressure_systolic, blood_pressure_diastolic, pulse_rate, temperature, respiratory_rate, oxygen_saturation, weight, height, notes) VALUES
(1, 1, 130, 85, 72, 98.6, 16, 98, 78.5, 175, 'Slightly elevated BP'),
(1, 1, 128, 83, 70, 98.5, 16, 98, 78.3, 175, 'BP improving'),
(2, 1, 120, 80, 68, 98.4, 15, 99, 65.0, 163, 'Normal readings'),
(3, 1, 125, 82, 75, 98.7, 17, 97, 82.1, 180, 'Post-operative vitals'),
(4, 1, 122, 81, 71, 98.6, 16, 99, 72.0, 172, 'Healthy vitals'),
(5, 2, 135, 88, 78, 99.0, 18, 96, 88.5, 178, 'Elevated pressure'),
(6, 2, 119, 79, 69, 98.5, 15, 99, 68.0, 165, 'Good condition'),
(7, 2, 127, 84, 73, 98.8, 16, 98, 85.0, 182, 'Slight elevation'),
(8, 3, 132, 87, 76, 99.1, 17, 97, 95.0, 185, 'Needs monitoring'),
(9, 3, 121, 80, 70, 98.6, 16, 99, 70.0, 170, 'Stable vitals');

-- =====================================================
-- 16. DIAGNOSES
-- =====================================================
INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_code, description, status, notes) VALUES
(1, 1, 'I10', 'Essential Hypertension', 'active', 'High blood pressure requiring management'),
(2, 2, 'G89.29', 'Other chronic pain', 'active', 'Chronic migraines'),
(3, 3, 'M25.561', 'Knee pain, right', 'resolved', 'Post-surgical recovery'),
(4, 1, 'Z00.00', 'Encounter for general adult medical exam', 'completed', 'Annual checkup'),
(5, 2, 'R42.0', 'Dizziness', 'active', 'Investigation pending'),
(6, 1, 'E03.9', 'Hypothyroidism, unspecified', 'active', 'On medication'),
(7, 3, 'M54.5', 'Low back pain', 'active', 'Chronic lower back pain'),
(8, 1, 'E11.9', 'Type 2 diabetes mellitus', 'active', 'Managed with medication'),
(9, 2, 'G89.29', 'Chronic pain', 'active', 'Post-treatment pain'),
(10, 3, 'S52.91', 'Unspecified fracture of forearm', 'healing', 'Healing well');

-- =====================================================
-- 17. PRESCRIPTIONS
-- =====================================================
INSERT INTO prescriptions (patient_id, doctor_id, medication_name, dosage, frequency, duration_days, instructions, status) VALUES
(1, 1, 'Lisinopril', '10mg', 'Once daily', 30, 'Take in morning with water', 'active'),
(1, 1, 'Atorvastatin', '20mg', 'Once daily', 30, 'Take in evening', 'active'),
(2, 2, 'Sumatriptan', '50mg', 'As needed', 30, 'Take at onset of migraine', 'active'),
(3, 3, 'Ibuprofen', '400mg', 'Twice daily', 14, 'With food', 'completed'),
(4, 1, 'Multivitamin', '1 tablet', 'Once daily', 30, 'With breakfast', 'active'),
(5, 2, 'Betahistine', '16mg', 'Three times daily', 30, 'With meals', 'active'),
(6, 1, 'Levothyroxine', '50mcg', 'Once daily', 30, 'Empty stomach, morning', 'active'),
(7, 3, 'Naproxen', '500mg', 'Twice daily', 21, 'With food', 'active'),
(8, 1, 'Metformin', '500mg', 'Three times daily', 30, 'With meals', 'active'),
(9, 2, 'Pregabalin', '75mg', 'Twice daily', 30, 'With food', 'active');

-- =====================================================
-- 18. PROGRESS NOTES (Nursing records)
-- =====================================================
INSERT INTO progress_notes (patient_id, recorded_by, shift, patient_condition, mood, activity_level, appetite, sleep_quality, detailed_notes) VALUES
(1, 1, 'Morning', 'Stable', 'Alert and oriented', 'Ambulatory', 'Good', 'Good', 'Patient resting comfortably, vitals stable, pain managed well'),
(1, 1, 'Evening', 'Stable', 'Calm', 'Ambulatory', 'Good', 'Excellent', 'No complaints, medication given on time'),
(2, 2, 'Morning', 'Fair', 'Anxious', 'Ambulatory', 'Fair', 'Poor', 'Patient reports difficulty sleeping, headache present'),
(3, 2, 'Morning', 'Good', 'Cheerful', 'Limited mobility', 'Good', 'Good', 'Recovery progressing well, minimal discomfort'),
(4, 3, 'Afternoon', 'Stable', 'Happy', 'Ambulatory', 'Excellent', 'Good', 'Patient in good spirits, ready for discharge'),
(5, 1, 'Evening', 'Fair', 'Worried', 'Assisted', 'Fair', 'Fair', 'Some dizziness episodes, monitoring continued'),
(6, 2, 'Morning', 'Good', 'Stable', 'Ambulatory', 'Good', 'Good', 'Thyroid medication working well'),
(7, 3, 'Afternoon', 'Fair', 'Uncomfortable', 'Limited mobility', 'Fair', 'Poor', 'Back pain affecting sleep, pain meds adjusted'),
(8, 1, 'Evening', 'Stable', 'Alert', 'Ambulatory', 'Good', 'Good', 'Blood glucose levels controlled'),
(9, 2, 'Morning', 'Good', 'Improving', 'Ambulatory', 'Good', 'Improving', 'Patient responding well to treatment');

-- =====================================================
-- 19. STAFF ABSENCES
-- =====================================================
INSERT INTO staff_absences (staff_id, absence_type, start_date, end_date, reason) VALUES
(7, 'leave', '2025-11-20', '2025-11-22', 'Vacation'),
(8, 'sick_leave', '2025-11-24', '2025-11-24', 'Fever'),
(10, 'leave', '2025-11-25', '2025-11-26', 'Personal'),
(12, 'sick_leave', '2025-11-23', '2025-11-23', 'Flu symptoms');

-- =====================================================
-- 20. Verify Data
-- =====================================================
SELECT 'Users' as 'Table', COUNT(*) as 'Count' FROM users
UNION ALL
SELECT 'Patients', COUNT(*) FROM patients
UNION ALL
SELECT 'Doctors', COUNT(*) FROM doctors
UNION ALL
SELECT 'Nurses', COUNT(*) FROM nurses
UNION ALL
SELECT 'Pharmacists', COUNT(*) FROM pharmacists
UNION ALL
SELECT 'Lab Technicians', COUNT(*) FROM lab_technicians
UNION ALL
SELECT 'Receptionists', COUNT(*) FROM receptionists
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Vital Signs', COUNT(*) FROM vital_signs
UNION ALL
SELECT 'Diagnoses', COUNT(*) FROM diagnoses
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Progress Notes', COUNT(*) FROM progress_notes
UNION ALL
SELECT 'Staff Absences', COUNT(*) FROM staff_absences;
