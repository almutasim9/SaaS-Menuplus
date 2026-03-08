import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cznkgbqovazxpgvhqgoj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bmtnYnFvdmF6eHBndmhxZ29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDc5MjMsImV4cCI6MjA4NzcyMzkyM30.ki1gG2UeEBVa0MvXtaSnXQxLs8lOfE3LqT4rhsFpQvQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data, error } = await supabase
        .from('products')
        .select('id, is_hidden')
        .limit(1)

    if (error) {
        console.error('Error:', error.message)
        console.error('Details:', error.details)
    } else {
        console.log('Success! Data:', data)
    }
}

check()
