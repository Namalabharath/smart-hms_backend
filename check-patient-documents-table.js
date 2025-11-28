const db = require('./config/database');

async function checkPatientDocumentsTable() {
    try {
        console.log('Checking patient_documents table structure...\n');
        
        // Get table description
        const [columns] = await db.query('DESCRIBE patient_documents');
        
        console.log('Current columns in patient_documents:');
        console.table(columns.map(col => ({ 
            Field: col.Field, 
            Type: col.Type, 
            Null: col.Null,
            Key: col.Key,
            Default: col.Default 
        })));
        
        console.log('\n✓ Required columns check:');
        const requiredColumns = ['id', 'patient_id', 'document_type', 'file_path', 'uploaded_by', 'description'];
        
        for (const colName of requiredColumns) {
            const exists = columns.some(col => col.Field === colName || col.Field === colName.replace('_', ''));
            console.log(`  ${exists ? '✓' : '✗'} ${colName}: ${exists ? 'EXISTS' : 'MISSING'}`);
        }
        
        // Check for filename vs file_name
        const hasFilename = columns.some(col => col.Field === 'filename');
        const hasFileName = columns.some(col => col.Field === 'file_name');
        console.log(`\nFilename column: ${hasFilename ? 'filename' : hasFileName ? 'file_name' : 'MISSING'}`);
        
        process.exit(0);
    } catch (error) {
        console.error('Error checking table:', error.message);
        process.exit(1);
    }
}

checkPatientDocumentsTable();
