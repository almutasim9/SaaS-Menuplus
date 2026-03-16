-- Support Tickets System
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'closed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    admin_reply TEXT,
    replied_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_support_ticket_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER support_tickets_updated_at
    BEFORE UPDATE ON support_tickets
    FOR EACH ROW EXECUTE FUNCTION update_support_ticket_timestamp();

-- RLS Policies
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;

-- Restaurant owners can see only their own tickets
CREATE POLICY "restaurant_owners_read_own_tickets" ON support_tickets
    FOR SELECT USING (
        restaurant_id IN (
            SELECT restaurant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Restaurant owners can create tickets for their own restaurant
CREATE POLICY "restaurant_owners_create_tickets" ON support_tickets
    FOR INSERT WITH CHECK (
        restaurant_id IN (
            SELECT restaurant_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Super admins can do everything (service role bypasses RLS anyway)
CREATE POLICY "super_admin_all" ON support_tickets
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'super_admin')
    );

-- Indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_restaurant ON support_tickets(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_created ON support_tickets(created_at DESC);
