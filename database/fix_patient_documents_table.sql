-- Fix patient_documents table to ensure all required columns exist
USE hospital_management_system;

-- First, check if the table exists
SELECT 'Checking patient_documents table...' AS status;

-- Add description column if it doesn't exist
ALTER TABLE patient_documents 
ADD COLUMN IF NOT EXISTS description TEXT AFTER file_path;

-- Ensure file_name column exists (might be named filename in some versions)
-- First check what columns we have
DESCRIBE patient_documents;

-- If you see 'filename' instead of 'file_name', run this:
-- ALTER TABLE patient_documents CHANGE COLUMN filename file_name VARCHAR(255) NOT NULL;

-- Verify the structure
SELECT 'patient_documents table structure:' AS message;
DESCRIBE patient_documents;

SELECT 'Fix completed successfully!' AS status;
