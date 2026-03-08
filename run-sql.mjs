import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
    // We'll use the rpc call or try directly if it's admin, but wait, typical supabase JS can't run DDL easily unless using postgres connection.
    console.log("Since psql is not available, please run this SQL in your Supabase SQL Editor:");
    console.log("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS compare_at_price NUMERIC(10,2) DEFAULT NULL;");
}

run();
