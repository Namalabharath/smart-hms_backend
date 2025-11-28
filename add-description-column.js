const db = require('./config/database');

async function addDescriptionColumn() {
    try {
        console.log('Adding description column to patient_documents table...\n');
        
        // Add description column
        await db.query('ALTER TABLE patient_documents ADD COLUMN description TEXT AFTER file_path');
        
        console.log('✓ Successfully added description column');
        
        // Verify
        const [columns] = await db.query('DESCRIBE patient_documents');
        const hasDescription = columns.some(col => col.Field === 'description');
        
        if (hasDescription) {
            console.log('✓ Verified: description column exists');
        } else {
            console.log('✗ Error: description column still missing');
        }
        
        process.exit(0);
    } catch (error) {
        if (error.message.includes('Duplicate column name')) {
            console.log('ℹ️  description column already exists');
            process.exit(0);
        } else {
            console.error('Error adding column:', error.message);
            process.exit(1);
        }
    }
}

addDescriptionColumn();
