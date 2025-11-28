const express = require('express');
const multer = require('multer');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const db = require('../config/database');
const { authMiddleware, roleMiddleware } = require('../middleware/authMiddleware');
const router = express.Router();

const upload = multer({ storage: multer.memoryStorage() });
const fs = require('fs');
const path = require('path');

// Feature flag: when not explicitly 'true', AI analysis is disabled and route
// will only save the uploaded file and return success.
const AI_ENABLED = process.env.AI_ENABLED === 'true';

// Helper: Get Gemini instance
const getGeminiAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY missing');
  return new GoogleGenerativeAI(apiKey);
};

/**
 * POST /api/prescription-analyze
 * (multipart with 'file', opt 'notes' field)
 * Returns: { success, analysis, details?, error? }
 */
router.post('/prescription-analyze', authMiddleware, roleMiddleware('patient'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const notes = req.body.notes || '';
    const filename = req.file.originalname || `upload_${Date.now()}`;
    const userId = req.user.id;

    // If AI analysis is disabled via env flag, return error - this route is for analysis only
    if (!AI_ENABLED) {
      return res.status(503).json({ 
        success: false,
        error: 'AI analysis is currently disabled. Please use the Documents tab to upload files.' 
      });
    }

    // AI analysis enabled: proceed to call Gemini
    // Use file name + notes for context
    const base64file = req.file.buffer.toString('base64');
    
    // Short, firm prompt -- LLM can't read the PDF but can simulate instruction
    const prompt = `Provide clear, patient-friendly medication instructions based on this prescription:
File Name: ${filename}
Notes: ${notes}
(If this is an image or scanned doc, only give safe, generic guidance. Do NOT guess drugs that cannot be read.)

Format:
{
 "howToTake": "...",
 "importantNotes": ["..."],
 "sideEffects": ["..."],
 "precautions": ["..."],
 "whenToContactDoctor": ["..."],
 "warnings": ["..." ]
}
`;
    
    const genAI = getGeminiAI();
    const modelNames = ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-pro-latest'];
    let text = null, lastError = null;
    for (const modelName of modelNames) {
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        text = response.text();
        break;
      } catch (err) {
        lastError = err;
        continue;
      }
    }
    if (!text) {
      const msg = lastError?.message || 'Unknown Gemini error';
      return res.status(503).json({ error: msg, details: lastError });
    }
    // Strip any markdown, parse JSON if possible
    let analysis = text;
    try {
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/```([\s\S]*?)```/) || [null, text];
      analysis = JSON.parse(jsonMatch[1] || text);
    } catch {/* keep as plain text if parsing fails */}
    res.json({ success: true, analysis, raw: text });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;

