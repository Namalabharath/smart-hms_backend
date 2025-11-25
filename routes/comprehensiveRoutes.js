const express = require('express');
const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

// Function to get Gemini AI instance
const getGeminiAI = () => {
    const apiKey = process.env.GEMINI_API_KEY || 'AIzaSyAKaDkSal6cEfifpbKD48GkHAH8yFjomnU';
    if (!apiKey || apiKey.trim() === '') {
        throw new Error('GEMINI_API_KEY is not configured');
    }
    return new GoogleGenerativeAI(apiKey);
};

// ============================================
// DOCTOR ENDPOINTS
// ============================================

// Doctor: Get their assigned patients
router.get('/doctor/my-patients', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const userId = req.user.id;
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        
        if (doctors.length === 0) {
            return res.json({ success: true, patients: [] });
        }
        
        const doctorId = doctors[0].id;
        const [appointments] = await db.query(
            `SELECT DISTINCT p.id, p.user_id, u.first_name, u.last_name, u.email, p.blood_group, p.date_of_birth, p.phone
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE a.doctor_id = ?
             ORDER BY u.first_name`,
            [doctorId]
        );
        
        res.json({ success: true, patients: appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: Get patient details with medical history
router.get('/doctor/patient/:patientId', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [patient] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email, u.username
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [patientId]
        );
        
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const [diagnoses] = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        const [prescriptions] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength
             FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.patient_id = ? ORDER BY pr.created_at DESC LIMIT 5`,
            [patientId]
        );
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 5',
            [patientId]
        );
        
        const [appointments] = await db.query(
            'SELECT * FROM appointments WHERE patient_id = ? ORDER BY appointment_date DESC LIMIT 5',
            [patientId]
        );
        
        res.json({
            success: true,
            patient: patient[0],
            diagnoses,
            prescriptions,
            vitals,
            appointments
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: Get AI suggestions for patient (diagnosis differentials, test recommendations, drug guidelines)
router.post('/doctor/patient/:patientId/ai-suggestions', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        // Initialize Gemini AI
        const genAI = getGeminiAI();
        
        // Get patient data
        const [patient] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email, u.username
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [patientId]
        );
        
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient not found' });
        }
        
        const [diagnoses] = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        const [prescriptions] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength
             FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.patient_id = ? ORDER BY pr.created_at DESC LIMIT 10`,
            [patientId]
        );
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 5',
            [patientId]
        );
        
        // Prepare patient data summary for AI
        const patientData = {
            name: `${patient[0].first_name} ${patient[0].last_name}`,
            age: patient[0].date_of_birth ? new Date().getFullYear() - new Date(patient[0].date_of_birth).getFullYear() : 'Unknown',
            bloodGroup: patient[0].blood_group || 'Unknown',
            allergies: patient[0].allergies || 'None known',
            diagnoses: diagnoses.map(d => ({
                name: d.diagnosis_name,
                icdCode: d.icd_code,
                severity: d.severity,
                description: d.description,
                date: d.created_at
            })),
            prescriptions: prescriptions.map(p => ({
                medication: p.medication_name,
                strength: p.strength,
                dosage: p.dosage,
                frequency: p.frequency,
                duration: p.duration
            })),
            vitals: vitals.length > 0 ? {
                temperature: vitals[0].temperature,
                heartRate: vitals[0].heart_rate,
                bloodPressure: `${vitals[0].blood_pressure_systolic}/${vitals[0].blood_pressure_diastolic}`,
                oxygenSaturation: vitals[0].oxygen_saturation
            } : null
        };
        
        // Create prompt for Gemini
        const prompt = `You are a medical AI assistant helping a doctor with patient analysis. Based on the following patient information, provide:

1. **Possible Diagnosis Differentials**: List 3-5 potential diagnoses based on the patient's symptoms, current diagnoses, prescriptions, and vital signs. For each, provide:
   - Diagnosis name
   - Likelihood (High/Medium/Low)
   - Brief reasoning

2. **Test Recommendations**: Suggest relevant diagnostic tests that would help confirm or rule out the differential diagnoses. Include:
   - Test name
   - Purpose/reason
   - Priority (High/Medium/Low)

3. **Drug Guidelines**: Review the current prescriptions and provide:
   - Drug interaction warnings (if any)
   - Dosage appropriateness
   - Recommendations for adjustments (if needed)
   - Contraindications based on patient allergies

Patient Information:
- Name: ${patientData.name}
- Age: ${patientData.age}
- Blood Group: ${patientData.bloodGroup}
- Allergies: ${patientData.allergies}

Current Diagnoses:
${patientData.diagnoses.length > 0 ? patientData.diagnoses.map(d => `- ${d.name} (${d.icdCode}): ${d.severity} - ${d.description}`).join('\n') : 'None recorded'}

Current Prescriptions:
${patientData.prescriptions.length > 0 ? patientData.prescriptions.map(p => `- ${p.medication} (${p.strength}): ${p.dosage}, ${p.frequency}, Duration: ${p.duration}`).join('\n') : 'None'}

Latest Vital Signs:
${patientData.vitals ? `- Temperature: ${patientData.vitals.temperature}°F\n- Heart Rate: ${patientData.vitals.heartRate} bpm\n- Blood Pressure: ${patientData.vitals.bloodPressure} mmHg\n- Oxygen Saturation: ${patientData.vitals.oxygenSaturation}%` : 'Not available'}

Please format your response as a JSON object with the following structure:
{
  "diagnosisDifferentials": [
    {
      "diagnosis": "Diagnosis name",
      "likelihood": "High/Medium/Low",
      "reasoning": "Brief explanation"
    }
  ],
  "testRecommendations": [
    {
      "test": "Test name",
      "purpose": "Why this test is recommended",
      "priority": "High/Medium/Low"
    }
  ],
  "drugGuidelines": {
    "interactions": ["Any drug interactions"],
    "dosageReview": "Review of current dosages",
    "recommendations": ["Any recommendations"],
    "contraindications": ["Any contraindications based on allergies"]
  }
}`;

        // Get Gemini model - try different model names in order
        const modelNames = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest', 'gemini-flash-latest'];
        let text = null;
        let lastError = null;
        
        for (const modelName of modelNames) {
            try {
                console.log(`Attempting to use Gemini model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                console.log(`Successfully got response from ${modelName}`);
                break;
            } catch (apiError) {
                console.error(`Model ${modelName} failed:`, apiError.message);
                lastError = apiError;
                continue;
            }
        }
        
        if (!text) {
            let errorMsg = lastError?.message || 'Unknown error';
            if (errorMsg.includes('403')) {
                errorMsg = 'API key does not have permission to access Gemini models. Please check: 1) API key is valid, 2) Generative Language API is enabled in Google Cloud Console, 3) API key has proper permissions.';
            } else if (errorMsg.includes('404')) {
                errorMsg = 'Gemini models not found. The API key may be invalid or the models are not available in your region.';
            } else if (errorMsg.includes('401')) {
                errorMsg = 'API key is invalid or expired. Please check your GEMINI_API_KEY.';
            }
            throw new Error(`Failed to generate AI suggestions: ${errorMsg}`);
        }
        
        // Try to parse JSON from response
        let aiSuggestions;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];
            const jsonText = jsonMatch[1] || text;
            aiSuggestions = JSON.parse(jsonText);
        } catch (parseError) {
            aiSuggestions = {
                rawResponse: text,
                error: "Could not parse structured response"
            };
        }
        
        res.json({
            success: true,
            suggestions: aiSuggestions,
            patientData: {
                name: patientData.name,
                diagnosesCount: diagnoses.length,
                prescriptionsCount: prescriptions.length
            }
        });
    } catch (error) {
        console.error('AI Suggestions Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate AI suggestions', 
            details: error.message 
        });
    }
});

// Doctor: Add diagnosis for patient
router.post('/doctor/diagnoses', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId, diagnosis_name, icd_code, severity, description } = req.body;
        const userId = req.user.id;
        
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const [result] = await db.query(
            `INSERT INTO diagnoses (patient_id, doctor_id, diagnosis_name, icd_code, severity, description)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, doctors[0].id, diagnosis_name, icd_code, severity, description]
        );
        
        res.json({ success: true, diagnosisId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: Create prescription
router.post('/doctor/prescriptions', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const { patientId, medication_id, dosage, frequency, duration } = req.body;
        const userId = req.user.id;
        
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const [result] = await db.query(
            `INSERT INTO prescriptions (patient_id, doctor_id, medication_id, dosage, frequency, duration)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, doctors[0].id, medication_id, dosage, frequency, duration]
        );
        
        res.json({ success: true, prescriptionId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: View appointments schedule
router.get('/doctor/appointments', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
        if (doctors.length === 0) {
            return res.json({ success: true, appointments: [] });
        }
        
        const [appointments] = await db.query(
            `SELECT a.*, u.first_name, u.last_name, p.id as patient_id
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users u ON p.user_id = u.id
             WHERE a.doctor_id = ?
             ORDER BY a.appointment_date DESC`,
            [doctors[0].id]
        );
        
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PATIENT ENDPOINTS
// ============================================

// Patient: Get own medical records
router.get('/patient/my-records', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        const patientId = patient[0].id;
        
        const [diagnoses] = await db.query(
            'SELECT * FROM diagnoses WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        const [prescriptions] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.patient_id = ? ORDER BY pr.created_at DESC`,
            [patientId]
        );
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC',
            [patientId]
        );
        
        const [labRequests] = await db.query(
            'SELECT * FROM lab_requests WHERE patient_id = ? ORDER BY created_at DESC',
            [patientId]
        );
        
        res.json({
            success: true,
            diagnoses,
            prescriptions,
            vitals,
            labRequests
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: Get AI analysis for a single prescription/document
router.post('/patient/prescription/:prescriptionId/ai-analysis', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        const { prescriptionId } = req.params;
        
        // Get patient info
        const [patient] = await db.query('SELECT id, allergies FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        const patientId = patient[0].id;
        const allergies = patient[0].allergies || 'None known';
        
        // Check if it's a database prescription or uploaded document
        const [prescription] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength 
             FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.id = ? AND pr.patient_id = ?`,
            [prescriptionId, patientId]
        );
        
        let prescriptionData = null;
        let isUploadedDoc = false;
        
        if (prescription.length > 0) {
            // It's a database prescription
            prescriptionData = {
                medication: prescription[0].medication_name,
                strength: prescription[0].strength,
                dosage: prescription[0].dosage,
                frequency: prescription[0].frequency,
                duration: prescription[0].duration,
                instructions: prescription[0].instructions || 'None provided',
                source: 'database'
            };
        } else {
            // Check if it's an uploaded document
            const [doc] = await db.query(
                `SELECT id, file_name AS filename, document_type, file_path, upload_date
                 FROM patient_documents 
                 WHERE id = ? AND patient_id = ? AND (document_type = 'prescription' OR document_type IS NULL)`,
                [prescriptionId, patientId]
            );
            
            if (doc.length === 0) {
                console.error(`Prescription document not found - ID: ${prescriptionId}, Patient ID: ${patientId}`);
                // Try without document_type filter in case it's not set
                const [docRetry] = await db.query(
                    `SELECT id, file_name AS filename, document_type, file_path, upload_date
                     FROM patient_documents 
                     WHERE id = ? AND patient_id = ?`,
                    [prescriptionId, patientId]
                );
                
                if (docRetry.length === 0) {
                    return res.status(404).json({ 
                        error: 'Prescription or document not found',
                        details: `Document ID ${prescriptionId} not found for patient ${patientId}`
                    });
                }
                
                // Use the retry result
                doc.push(docRetry[0]);
            }
            
            isUploadedDoc = true;
            prescriptionData = {
                medication: doc[0].filename || doc[0].file_name || 'Prescription Document',
                strength: 'See document',
                dosage: 'See document',
                frequency: 'See document',
                duration: 'See document',
                instructions: 'Please refer to the uploaded prescription document for details.',
                source: 'uploaded',
                uploadDate: doc[0].upload_date,
                filename: doc[0].filename || doc[0].file_name
            };
        }
        
        // Create patient-friendly prompt for single prescription
        const prompt = `You are a helpful medical assistant providing patient-friendly medication instructions. Analyze this prescription and provide clear, easy-to-understand guidance for the patient.

Patient Information:
- Known Allergies: ${allergies}

Prescription Details:
${isUploadedDoc 
    ? `- Medication: ${prescriptionData.medication} (Uploaded Document)
   - Description: ${prescriptionData.instructions}
   - Uploaded: ${prescriptionData.uploadDate ? new Date(prescriptionData.uploadDate).toLocaleDateString() : 'Recently'}
   - Note: This is an uploaded prescription document. Provide general guidance based on common practices for prescription medications.`
    : `- Medication: ${prescriptionData.medication} (${prescriptionData.strength})
   - Dosage: ${prescriptionData.dosage}
   - Frequency: ${prescriptionData.frequency}
   - Duration: ${prescriptionData.duration}
   - Doctor's Instructions: ${prescriptionData.instructions}`}

Please provide patient-friendly instructions in JSON format:
{
  "medication": "${prescriptionData.medication}",
  "howToTake": "Clear instructions on how to take this medication",
  "importantNotes": ["Important points"],
  "sideEffects": ["Common side effects"],
  "precautions": ["Things to avoid"],
  "foodInteractions": ["Food or drink interactions"],
  "whenToContactDoctor": ["When to contact doctor"],
  "storage": "How to store this medication",
  "missedDose": "What to do if a dose is missed"
}`;

        const genAI = getGeminiAI();
        const modelNames = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest'];
        let text = null;
        let lastError = null;
        
        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                break;
            } catch (apiError) {
                lastError = apiError;
                continue;
            }
        }
        
        if (!text) {
            throw new Error(`Failed to generate analysis: ${lastError?.message || 'Unknown error'}`);
        }
        
        let aiAnalysis;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];
            const jsonText = jsonMatch[1] || text;
            aiAnalysis = JSON.parse(jsonText);
        } catch (parseError) {
            aiAnalysis = {
                medication: prescriptionData.medication,
                howToTake: 'Please refer to your doctor\'s instructions or medication label.',
                importantNotes: ['Always follow your doctor\'s prescribed dosage'],
                sideEffects: ['Consult your doctor if you experience any unusual symptoms'],
                precautions: ['Do not stop taking medication without consulting your doctor'],
                foodInteractions: ['Ask your doctor about food interactions'],
                whenToContactDoctor: ['If you experience severe side effects or allergic reactions'],
                storage: 'Store medications in a cool, dry place away from children',
                missedDose: 'If you miss a dose, take it as soon as you remember'
            };
        }
        
        res.json({
            success: true,
            analysis: aiAnalysis,
            prescription: prescriptionData
        });
    } catch (error) {
        console.error('Prescription AI Analysis Error:', error);
        res.status(500).json({ 
            error: 'Failed to analyze prescription', 
            details: error.message 
        });
    }
});

// Patient: Get AI suggestions for prescriptions (patient-friendly instructions)
router.post('/patient/prescriptions/ai-suggestions', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        // Get patient info
        const [patient] = await db.query('SELECT id, allergies FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        const patientId = patient[0].id;
        const allergies = patient[0].allergies || 'None known';
        
        // Get all active prescriptions from database
        const [prescriptions] = await db.query(
            `SELECT pr.*, m.name as medication_name, m.strength 
             FROM prescriptions pr
             JOIN medications m ON pr.medication_id = m.id
             WHERE pr.patient_id = ? 
             ORDER BY pr.created_at DESC`,
            [patientId]
        );
        
        // Get uploaded prescription documents
        const [uploadedDocs] = await db.query(
            `SELECT id, file_name AS filename, document_type, file_path, upload_date
             FROM patient_documents 
             WHERE patient_id = ? AND document_type = 'prescription'
             ORDER BY upload_date DESC`,
            [patientId]
        );
        
        if (prescriptions.length === 0 && uploadedDocs.length === 0) {
            return res.json({
                success: true,
                suggestions: {
                    message: 'No prescriptions found. Please consult with your doctor for medication instructions.',
                    instructions: []
                }
            });
        }
        
        // Prepare prescription data for AI
        const prescriptionData = prescriptions.map(p => ({
            medication: p.medication_name,
            strength: p.strength,
            dosage: p.dosage,
            frequency: p.frequency,
            duration: p.duration,
            instructions: p.instructions || 'None provided',
            source: 'database'
        }));
        
        uploadedDocs.forEach(doc => {
            prescriptionData.push({
                medication: doc.filename || 'Prescription Document',
                strength: 'See document',
                dosage: 'See document',
                frequency: 'See document',
                duration: 'See document',
                instructions: doc.description || 'Please refer to the uploaded prescription document for details.',
                source: 'uploaded',
                uploadDate: doc.upload_date
            });
        });
        
        // Create patient-friendly prompt
        const prompt = `You are a helpful medical assistant providing patient-friendly medication instructions. Based on the following prescription information, provide clear, easy-to-understand guidance for the patient.

Patient Information:
- Known Allergies: ${allergies}

Current Prescriptions:
${prescriptionData.map((p, idx) => {
            if (p.source === 'uploaded') {
                return `${idx + 1}. ${p.medication} (Uploaded Document)
   - Description: ${p.instructions}
   - Uploaded: ${p.uploadDate ? new Date(p.uploadDate).toLocaleDateString() : 'Recently'}`;
            } else {
                return `${idx + 1}. ${p.medication} (${p.strength})
   - Dosage: ${p.dosage}
   - Frequency: ${p.frequency}
   - Duration: ${p.duration}
   - Doctor's Instructions: ${p.instructions}`;
            }
        }).join('\n\n')}

Please provide patient-friendly instructions in JSON format:
{
  "instructions": [
    {
      "medication": "Medication name",
      "howToTake": "Clear instructions on how to take this medication",
      "importantNotes": ["Important points"],
      "sideEffects": ["Common side effects"],
      "precautions": ["Things to avoid"],
      "foodInteractions": ["Food or drink interactions"],
      "whenToContactDoctor": ["When to contact doctor"]
    }
  ],
  "generalGuidance": {
    "storage": "How to store medications",
    "missedDose": "What to do if a dose is missed",
    "generalTips": ["General tips"]
  },
  "warnings": ["Important warnings"]
}`;

        const genAI = getGeminiAI();
        const modelNames = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest'];
        let text = null;
        let lastError = null;
        
        for (const modelName of modelNames) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                text = response.text();
                break;
            } catch (apiError) {
                lastError = apiError;
                continue;
            }
        }
        
        if (!text) {
            throw new Error(`Failed to generate instructions: ${lastError?.message || 'Unknown error'}`);
        }
        
        let aiSuggestions;
        try {
            const jsonMatch = text.match(/```json\s*([\s\S]*?)\s*```/) || text.match(/```\s*([\s\S]*?)\s*```/) || [null, text];
            const jsonText = jsonMatch[1] || text;
            aiSuggestions = JSON.parse(jsonText);
        } catch (parseError) {
            aiSuggestions = {
                rawResponse: text,
                instructions: prescriptionData.map(p => ({
                    medication: p.medication,
                    howToTake: 'Please refer to your doctor\'s instructions.',
                    importantNotes: ['Always follow your doctor\'s prescribed dosage'],
                    sideEffects: ['Consult your doctor if you experience any unusual symptoms'],
                    precautions: ['Do not stop taking medication without consulting your doctor'],
                    foodInteractions: ['Ask your doctor about food interactions'],
                    whenToContactDoctor: ['If you experience severe side effects or allergic reactions']
                })),
                generalGuidance: {
                    storage: 'Store medications in a cool, dry place away from children',
                    missedDose: 'If you miss a dose, take it as soon as you remember',
                    generalTips: ['Take medications at the same time each day']
                },
                warnings: allergies !== 'None known' ? [`Be aware of your allergies: ${allergies}`] : []
            };
        }
        
        res.json({
            success: true,
            suggestions: aiSuggestions,
            prescriptionCount: prescriptions.length + uploadedDocs.length
        });
    } catch (error) {
        console.error('Patient Prescription AI Error:', error);
        res.status(500).json({ 
            error: 'Failed to generate medication instructions', 
            details: error.message 
        });
    }
});

// Patient: Get profile
router.get('/patient/profile', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [patient] = await db.query(
            `SELECT p.*, u.first_name, u.last_name, u.email, u.username
             FROM patients p
             JOIN users u ON p.user_id = u.id
             WHERE p.user_id = ?`,
            [userId]
        );
        
        if (patient.length === 0) {
            return res.status(404).json({ error: 'Patient profile not found' });
        }
        
        res.json({ success: true, patient: patient[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: View appointments
router.get('/patient/appointments', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const userId = req.user.id;
        
        const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        if (patient.length === 0) {
            return res.json({ success: true, appointments: [] });
        }
        
        const [appointments] = await db.query(
            `SELECT a.*, d.specialization, u.first_name, u.last_name
             FROM appointments a
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users u ON d.user_id = u.id
             WHERE a.patient_id = ?
             ORDER BY a.appointment_date DESC`,
            [patient[0].id]
        );
        
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// NURSE ENDPOINTS
// ============================================

// Nurse: Record vital signs
router.post('/nurse/vital-signs', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation } = req.body;
        
        const [result] = await db.query(
            `INSERT INTO vital_signs (patient_id, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [patientId, temperature, heart_rate, blood_pressure_systolic, blood_pressure_diastolic, oxygen_saturation]
        );
        
        res.json({ success: true, vitalSignId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get patients for vital signs
router.get('/nurse/patients', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const [patients] = await db.query(
            `SELECT p.id, u.first_name, u.last_name, p.blood_group, u.email
             FROM patients p
             JOIN users u ON p.user_id = u.id
             ORDER BY u.first_name`
        );
        
        res.json({ success: true, patients });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get dashboard stats
router.get('/nurse/dashboard/stats', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const [patients] = await db.query('SELECT COUNT(*) as count FROM patients');
        const [vitals] = await db.query('SELECT COUNT(*) as count FROM vital_signs');
        const [notes] = await db.query('SELECT COUNT(*) as count FROM progress_notes');
        const [monitored] = await db.query(
            `SELECT COUNT(DISTINCT patient_id) as count FROM vital_signs WHERE recorded_at >= DATE_SUB(NOW(), INTERVAL 1 DAY)`
        );
        
        res.json({ 
            success: true, 
            stats: {
                totalPatients: patients[0]?.count || 0,
                vitalRecordings: vitals[0]?.count || 0,
                progressNotesAdded: notes[0]?.count || 0,
                patientsMonitored: monitored[0]?.count || 0
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Record daily progress
router.post('/nurse/daily-progress', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId, appetite, sleep_hours, mood, pain_level, notes } = req.body;
        const userId = req.user.id;
        
        const [nurses] = await db.query('SELECT id FROM nurses WHERE user_id = ?', [userId]);
        if (nurses.length === 0) {
            return res.status(403).json({ error: 'Not authorized' });
        }
        
        const [result] = await db.query(
            `INSERT INTO daily_progress (patient_id, nurse_id, appetite, sleep_hours, mood, pain_level, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [patientId, nurses[0].id, appetite, sleep_hours, mood, pain_level, notes]
        );
        
        res.json({ success: true, progressId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get all vitals
router.get('/nurse/vitals/:patientId', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 50',
            [patientId]
        );
        
        res.json({ success: true, vitals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get progress notes
router.get('/nurse/progress/:patientId', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [notes] = await db.query(
            'SELECT * FROM progress_notes WHERE patient_id = ? ORDER BY recorded_at DESC LIMIT 50',
            [patientId]
        );
        
        res.json({ success: true, progressNotes: notes });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Nurse: Get patient vital signs history (old endpoint - kept for compatibility)
router.get('/nurse/patient/:patientId/vitals', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const { patientId } = req.params;
        
        const [vitals] = await db.query(
            'SELECT * FROM vital_signs WHERE patient_id = ? ORDER BY recorded_at DESC',
            [patientId]
        );
        
        res.json({ success: true, vitals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ADMIN ENDPOINTS
// ============================================

// Admin: Get all users
router.get('/admin/users', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [users] = await db.query(
            'SELECT id, username, email, first_name, last_name, role, is_active FROM users ORDER BY created_at DESC'
        );
        
        res.json({ success: true, users });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get statistics
router.get('/admin/statistics', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [totalUsers] = await db.query('SELECT COUNT(*) as count FROM users');
        const [totalPatients] = await db.query('SELECT COUNT(*) as count FROM patients');
        const [totalDoctors] = await db.query('SELECT COUNT(*) as count FROM doctors');
        const [totalAppointments] = await db.query('SELECT COUNT(*) as count FROM appointments');
        const [completedAppointments] = await db.query("SELECT COUNT(*) as count FROM appointments WHERE status = 'completed'");
        const [lowStockMeds] = await db.query('SELECT COUNT(*) as count FROM medications WHERE stock_quantity <= reorder_level');
        
        res.json({
            success: true,
            stats: {
                totalUsers: totalUsers[0].count,
                totalPatients: totalPatients[0].count,
                totalDoctors: totalDoctors[0].count,
                totalAppointments: totalAppointments[0].count,
                completedAppointments: completedAppointments[0].count,
                lowStockMeds: lowStockMeds[0].count
            }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all appointments
router.get('/admin/appointments', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [appointments] = await db.query(
            `SELECT a.*, p_user.first_name as patient_first_name, p_user.last_name as patient_last_name,
                    d_user.first_name as doctor_first_name, d_user.last_name as doctor_last_name
             FROM appointments a
             JOIN patients p ON a.patient_id = p.id
             JOIN users p_user ON p.user_id = p_user.id
             JOIN doctors d ON a.doctor_id = d.id
             JOIN users d_user ON d.user_id = d_user.id
             ORDER BY a.appointment_date DESC`
        );
        
        res.json({ success: true, appointments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get all diagnoses
router.get('/admin/diagnoses', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [diagnoses] = await db.query(
            `SELECT d.*, p_user.first_name as patient_name, doc_user.first_name as doctor_name
             FROM diagnoses d
             JOIN patients p ON d.patient_id = p.id
             JOIN users p_user ON p.user_id = p_user.id
             JOIN doctors doc ON d.doctor_id = doc.id
             JOIN users doc_user ON doc.user_id = doc_user.id
             ORDER BY d.created_at DESC`
        );
        
        res.json({ success: true, diagnoses });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get medications inventory
router.get('/admin/medications', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [medications] = await db.query(
            'SELECT * FROM medications ORDER BY name'
        );
        
        res.json({ success: true, medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get low stock medications
router.get('/admin/medications/low-stock', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [medications] = await db.query(
            'SELECT * FROM medications WHERE stock_quantity <= reorder_level ORDER BY stock_quantity ASC'
        );
        
        res.json({ success: true, medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Update medication stock
router.put('/admin/medications/:medicationId', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { medicationId } = req.params;
        const { stock_quantity } = req.body;
        
        await db.query(
            'UPDATE medications SET stock_quantity = ? WHERE id = ?',
            [stock_quantity, medicationId]
        );
        
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Admin: Get staff attendance
router.get('/admin/staff-attendance', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const [attendance] = await db.query(
            `SELECT sa.*, u.username, u.first_name, u.last_name, u.role
             FROM staff_attendance sa
             JOIN users u ON sa.user_id = u.id
             ORDER BY sa.attendance_date DESC LIMIT 50`
        );
        
        res.json({ success: true, attendance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// SHARED ENDPOINTS
// ============================================

// Get all medications (shared)
router.get('/medications', authMiddleware, async (req, res) => {
    try {
        const [medications] = await db.query('SELECT * FROM medications ORDER BY name');
        res.json({ success: true, medications });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all doctors (for scheduling)
router.get('/doctors', authMiddleware, async (req, res) => {
    try {
        const [doctors] = await db.query(
            `SELECT d.id, d.specialization, d.department, u.first_name, u.last_name, u.email
             FROM doctors d
             JOIN users u ON d.user_id = u.id
             ORDER BY u.first_name`
        );
        
        res.json({ success: true, doctors });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get dashboard summary for current user
router.get('/dashboard-summary', authMiddleware, async (req, res) => {
    try {
        const userId = req.user?.id;
        const role = req.user?.role;
        
        let summary = {};
        
        if (role === 'doctor') {
            const [doctors] = await db.query('SELECT id FROM doctors WHERE user_id = ?', [userId]);
            if (doctors.length > 0) {
                const doctorId = doctors[0].id;
                const [patients] = await db.query(
                    `SELECT COUNT(DISTINCT patient_id) as count FROM appointments WHERE doctor_id = ?`,
                    [doctorId]
                );
                const [appointments] = await db.query(
                    `SELECT COUNT(*) as count FROM appointments WHERE doctor_id = ?`,
                    [doctorId]
                );
                const [diagnoses] = await db.query(
                    `SELECT COUNT(*) as count FROM diagnoses WHERE doctor_id = ?`,
                    [doctorId]
                );
                summary = {
                    patientCount: patients[0]?.count || 0,
                    upcomingAppointments: appointments[0]?.count || 0,
                    diagnosesCount: diagnoses[0]?.count || 0
                };
            }
        } else if (role === 'patient') {
            const [patient] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
            if (patient.length > 0) {
                const patientId = patient[0].id;
                const [appointments] = await db.query(
                    `SELECT COUNT(*) as count FROM appointments WHERE patient_id = ?`,
                    [patientId]
                );
                const [diagnoses] = await db.query(
                    `SELECT COUNT(*) as count FROM diagnoses WHERE patient_id = ?`,
                    [patientId]
                );
                const [prescriptions] = await db.query(
                    `SELECT COUNT(*) as count FROM prescriptions WHERE patient_id = ?`,
                    [patientId]
                );
                summary = {
                    upcomingAppointments: appointments[0]?.count || 0,
                    diagnosesCount: diagnoses[0]?.count || 0,
                    prescriptionsCount: prescriptions[0]?.count || 0
                };
            }
        } else if (role === 'admin') {
            const [users] = await db.query('SELECT COUNT(*) as count FROM users');
            const [patients] = await db.query('SELECT COUNT(*) as count FROM patients');
            const [appointments] = await db.query('SELECT COUNT(*) as count FROM appointments');
            summary = {
                totalUsers: users[0]?.count || 0,
                totalPatients: patients[0]?.count || 0,
                pendingAppointments: appointments[0]?.count || 0
            };
        }
        
        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// PATIENT DOCUMENT MANAGEMENT
// ============================================

// Patient: Upload document
router.post('/patient/documents/upload', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const { userId } = req.user;
        const { documentType, filename, fileContent, description } = req.body;

        // Get patient ID
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length === 0) {
            return res.status(404).json({ error: 'Patient record not found' });
        }

        const patientId = patients[0].id;

        // Insert document record - using correct column names from schema
        // Note: description column doesn't exist in the table, so we'll store it in a note or skip it
        const [result] = await db.query(
            `INSERT INTO patient_documents (patient_id, document_type, file_name, file_path, uploaded_by) 
             VALUES (?, ?, ?, ?, ?)`,
            [patientId, documentType, filename, filename || `document_${Date.now()}`, req.user.id]
        );

        res.json({ success: true, message: 'Document uploaded', documentId: result.insertId });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: Get their documents
router.get('/patient/documents', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [req.user.id]);
        if (patients.length === 0) {
            return res.json({ success: true, documents: [] });
        }

        const patientId = patients[0].id;
        const [documents] = await db.query(
            `SELECT id, patient_id, document_type, file_name AS filename, file_path, uploaded_by, upload_date
             FROM patient_documents 
             WHERE patient_id = ? 
             ORDER BY upload_date DESC`,
            [patientId]
        );

        // Map documents to include filename field for frontend compatibility
        const mappedDocuments = documents.map(doc => ({
            ...doc,
            filename: doc.filename || doc.file_name,
            description: doc.description || '' // Will be empty since column doesn't exist
        }));

        res.json({ success: true, documents: mappedDocuments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient: Download document
router.get('/patient/documents/:documentId', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    try {
        const [documents] = await db.query(
            `SELECT pd.* FROM patient_documents pd
             JOIN patients p ON pd.patient_id = p.id
             WHERE pd.id = ? AND p.user_id = ?`,
            [req.params.documentId, req.user.id]
        );

        if (documents.length === 0) {
            return res.status(404).json({ error: 'Document not found' });
        }

        res.json({ success: true, document: documents[0] });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Doctor: View patient documents
router.get('/doctor/patient/:patientId/documents', authMiddleware, roleMiddleware('doctor'), async (req, res) => {
    try {
        const [documents] = await db.query(
            `SELECT id, patient_id, document_type, file_name AS filename, file_path, uploaded_by, upload_date
             FROM patient_documents 
             WHERE patient_id = ? 
             ORDER BY upload_date DESC`,
            [req.params.patientId]
        );

        // Map documents to include filename field for frontend compatibility
        const mappedDocuments = documents.map(doc => ({
            ...doc,
            filename: doc.filename || doc.file_name
        }));

        res.json({ success: true, documents: mappedDocuments });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============================================
// ROUTE ALIASES FOR COMPATIBILITY
// ============================================

// Nurse aliases
router.get('/nurse/assigned-patients', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    return axios.get('http://localhost:5000/api/nurse/patients', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

router.get('/nurse/vitals', authMiddleware, roleMiddleware('nurse'), async (req, res) => {
    try {
        const [userId] = await db.query('SELECT id FROM nurses WHERE user_id = ?', [req.user.id]);
        if (userId.length === 0) return res.json({ success: true, vitals: [] });
        
        const [vitals] = await db.query(
            `SELECT * FROM vital_signs WHERE created_by = ? ORDER BY recorded_at DESC LIMIT 50`,
            [userId[0].id]
        );
        res.json({ success: true, vitals });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Patient aliases
router.get('/patient/my-appointments', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    return axios.get('http://localhost:5000/api/patient/appointments', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

router.get('/patient/medical-records', authMiddleware, roleMiddleware('patient'), async (req, res) => {
    return axios.get('http://localhost:5000/api/patient/my-records', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

// Lab technician aliases
router.get('/lab-technician/requests', authMiddleware, roleMiddleware('lab_technician'), async (req, res) => {
    return axios.get('http://localhost:5000/api/lab-technician/requests', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

// Receptionist aliases
router.get('/receptionist/patients', authMiddleware, roleMiddleware('receptionist'), async (req, res) => {
    return axios.get('http://localhost:5000/api/receptionist/patients', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

// Pharmacist aliases
router.get('/pharmacist/prescriptions', authMiddleware, roleMiddleware('pharmacist'), async (req, res) => {
    return axios.get('http://localhost:5000/api/pharmacist/prescriptions', {
        headers: { Authorization: `Bearer ${req.headers.authorization?.split(' ')[1]}` }
    }).then(r => res.json(r.data)).catch(e => res.status(500).json({ error: e.message }));
});

module.exports = router;
