import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cznkgbqovazxpgvhqgoj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bmtnYnFvdmF6eHBndmhxZ29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDc5MjMsImV4cCI6MjA4NzcyMzkyM30.ki1gG2UeEBVa0MvXtaSnXQxLs8lOfE3LqT4rhsFpQvQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testInsert() {
    // First get a valid restaurant ID
    const { data: profiles } = await supabase.from('profiles').select('restaurant_id').limit(1)
    if (!profiles || profiles.length === 0 || !profiles[0].restaurant_id) {
        console.error('No restaurant found to test with')
        return
    }

    const restaurantId = profiles[0].restaurant_id

    console.log('Testing insert with restaurant:', restaurantId)

    const { data, error } = await supabase
        .from("delivery_zones")
        .insert({
            restaurant_id: restaurantId,
            zone_name: 'test_zone',
            flat_rate: 5,
            free_delivery_threshold: null,
        })
        .select()
        .single()

    if (error) {
        console.error('Insert Error:', error.message)
        console.error('Insert details:', error.details)
    } else {
        console.log('Insert success:', data)
    }
}

testInsert()
