import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cznkgbqovazxpgvhqgoj.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN6bmtnYnFvdmF6eHBndmhxZ29qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIxNDc5MjMsImV4cCI6MjA4NzcyMzkyM30.ki1gG2UeEBVa0MvXtaSnXQxLs8lOfE3LqT4rhsFpQvQ'
const supabase = createClient(supabaseUrl, supabaseKey)

async function testAreaInsert() {
    const { data: zones } = await supabase.from('delivery_zones').select('id').limit(1)
    if (!zones || zones.length === 0 || !zones[0].id) {
        console.error('No zones found to test with')
        return
    }

    const zoneId = zones[0].id

    console.log('Testing insert with zone:', zoneId)

    const { data, error } = await supabase
        .from("delivery_areas")
        .insert({
            zone_id: zoneId,
            area_name: 'test_area',
        })
        .select()
        .single()

    if (error) {
        console.error('Insert Error:', error.message)
        console.error('Insert details:', error.details)
    } else {
        console.log('Insert success:', data)
        // Cleanup
        await supabase.from("delivery_areas").delete().eq('id', data.id)
    }
}

testAreaInsert()
