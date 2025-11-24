const db = require('./config/database');
const fs = require('fs');
const path = require('path');

async function seedDatabase() {
    try {
        console.log('🌱 Starting database seed...\n');
        
        // Read seed data file
        const seedFile = path.join(__dirname, 'database', 'seed_data.sql');
        const seedSQL = fs.readFileSync(seedFile, 'utf8');
        
        // Split by semicolon and filter empty statements
        const statements = seedSQL
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
        
        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
        
        let executed = 0;
        let skipped = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            // Skip comments and empty lines
            if (statement.startsWith('--') || statement.length === 0) {
                skipped++;
                continue;
            }
            
            try {
                console.log(`⏳ Executing (${i + 1}/${statements.length}): ${statement.substring(0, 60)}...`);
                await db.query(statement + ';');
                executed++;
                console.log(`   ✅ Success\n`);
            } catch (error) {
                if (error.message.includes('Duplicate entry')) {
                    console.log(`   ⚠️  Skipped (duplicate data)\n`);
                    skipped++;
                } else {
                    console.log(`   ❌ Error: ${error.message}\n`);
                }
            }
        }
        
        console.log('\n✅ Seed Complete!');
        console.log(`   ✅ Executed: ${executed} statements`);
        console.log(`   ⏭️  Skipped: ${skipped} statements`);
        
        // Show summary
        console.log('\n📊 Data Summary:');
        
        const tables = [
            'users', 'patients', 'doctors', 'nurses', 'pharmacists', 
            'lab_technicians', 'receptionists', 'appointments', 
            'vital_signs', 'diagnoses', 'prescriptions', 'progress_notes', 
            'staff_absences'
        ];
        
        for (const table of tables) {
            const [result] = await db.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`   📋 ${table}: ${result[0].count} records`);
        }
        
        console.log('\n✅ Database seeding completed successfully!\n');
        
        // Show default credentials
        console.log('🔐 Default Credentials:');
        console.log('   Password: (all users) Password123 (hashed)\n');
        console.log('   👨‍💼 Admin:        admin_raj');
        console.log('   👨‍💼 Receptionist: receptionist_priya');
        console.log('   👨‍⚕️  Doctor:       doctor_smith');
        console.log('   👩‍⚕️  Nurse:        nurse_sarah');
        console.log('   💊 Pharmacist:     pharmacist_alex');
        console.log('   🔬 Lab Tech:       lab_tech_david');
        console.log('   👤 Patient:        patient_robert\n');
        
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Seed Error:', error);
        process.exit(1);
    }
}

seedDatabase();
