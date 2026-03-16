import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function importLocations() {
    try {
        console.log('Loading Excel file...');
        const workbook = XLSX.readFile('locations.xlsx');

        // 1. Import Governorates
        console.log('Importing Governorates...');
        const govSheet = workbook.Sheets['Governorates'];
        const govData = XLSX.utils.sheet_to_json(govSheet, { header: 1 });
        
        const governorates = govData.slice(1).map(row => ({
            id: row[0],
            name_ar: row[1],
            name_en: row[2],
            name_ku: row[3]
        })).filter(g => g.id && g.name_ar);

        const { error: govError } = await supabase
            .from('master_governorates')
            .upsert(governorates, { onConflict: 'id' });

        if (govError) throw govError;
        console.log(`Successfully imported ${governorates.length} governorates.`);

        // 2. Import Districts (Areas)
        console.log('Importing Districts (Areas)... this might take a while.');
        const districtSheet = workbook.Sheets['Districts'];
        const districtData = XLSX.utils.sheet_to_json(districtSheet, { header: 1 });
        
        const districts = districtData.slice(1).map(row => ({
            id: row[0],
            name_ar: row[1],
            name_en: row[2],
            name_ku: row[3],
            governorate_id: row[4],
            governorate_name_ar: row[5],
            city_name_ar: row[5] // Using governorate name as city name if no distinct city column
        })).filter(d => d.id && d.name_ar && d.governorate_name_ar);

        // Chunking the upload to avoid size limits
        const chunkSize = 500;
        for (let i = 0; i < districts.length; i += chunkSize) {
            const chunk = districts.slice(i, i + chunkSize);
            const { error: distError } = await supabase
                .from('master_locations')
                .upsert(chunk, { onConflict: 'id' });

            if (distError) throw distError;
            console.log(`Imported ${i + chunk.length}/${districts.length} districts...`);
        }

        console.log('Import completed successfully!');
    } catch (error) {
        console.error('Import failed:', error.message);
    }
}

importLocations();
