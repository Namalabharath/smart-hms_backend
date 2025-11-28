const db = require('./config/database');

async function testDocumentInsert() {
    try {
        console.log('Testing document insert...\n');
        
        // Get a test patient
        const [users] = await db.query('SELECT id FROM users WHERE role = "patient" LIMIT 1');
        if (users.length === 0) {
            console.log('No patient users found');
            process.exit(1);
        }
        
        const userId = users[0].id;
        console.log('Using user ID:', userId);
        
        // Get or create patient record
        let [patients] = await db.query('SELECT id FROM patients WHERE user_id = ?', [userId]);
        
        if (patients.length === 0) {
            const [insertResult] = await db.query('INSERT INTO patients (user_id) VALUES (?)', [userId]);
            patients = [{ id: insertResult.insertId }];
            console.log('Created patient record with ID:', patients[0].id);
        } else {
            console.log('Found patient ID:', patients[0].id);
        }

        const patientId = patients[0].id;

        // Try to insert a test document
        const testData = {
            patient_id: patientId,
            document_type: 'test',
            file_name: 'test.pdf',
            file_path: '/uploads/test.pdf',
            uploaded_by: userId,
            description: 'Test document'
        };

        console.log('\nInserting test document with data:', testData);
        
        const [result] = await db.query(
            `INSERT INTO patient_documents (patient_id, document_type, file_name, file_path, uploaded_by, upload_date, description) 
             VALUES (?, ?, ?, ?, ?, NOW(), ?)`,
            [testData.patient_id, testData.document_type, testData.file_name, testData.file_path, testData.uploaded_by, testData.description]
        );

        console.log('✓ Successfully inserted document with ID:', result.insertId);
        
        // Verify it was inserted
        const [docs] = await db.query('SELECT * FROM patient_documents WHERE id = ?', [result.insertId]);
        console.log('\nVerification - Retrieved document:');
        console.table(docs);
        
        // Clean up test data
        await db.query('DELETE FROM patient_documents WHERE id = ?', [result.insertId]);
        console.log('\n✓ Test completed and cleaned up');
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        console.error('Full error:', error);
        process.exit(1);
    }
}

testDocumentInsert();
