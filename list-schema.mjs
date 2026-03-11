import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function listSchema() {
    console.log('Fetching full schema details from PostgREST...');

    try {
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`
            }
        });
        const schema = await response.json();

        if (schema.definitions) {
            for (const [tableName, definition] of Object.entries(schema.definitions)) {
                console.log(`\nTable: ${tableName}`);
                if (definition.properties) {
                    Object.keys(definition.properties).forEach(col => {
                        console.log(`  - ${col}`);
                    });
                }
            }
        } else {
            console.log('No definitions found.');
        }
    } catch (err) {
        console.error('Error fetching schema:', err.message);
    }
}

listSchema()
