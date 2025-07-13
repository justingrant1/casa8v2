-- Casa8 Communication System Migration
-- This creates tables for applications, messages, and notifications

-- =============================================
-- APPLICATIONS SYSTEM
-- =============================================

-- Applications table for tenant property applications
CREATE TABLE IF NOT EXISTS applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Application Status
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
    
    -- Tenant Information
    tenant_name VARCHAR(255) NOT NULL,
    tenant_email VARCHAR(255) NOT NULL,
    tenant_phone VARCHAR(20),
    
    -- Application Details
    move_in_date DATE,
    lease_length_months INTEGER DEFAULT 12,
    monthly_income DECIMAL(10,2),
    employment_status VARCHAR(100),
    employer_name VARCHAR(255),
    
    -- Voucher Information
    has_voucher BOOLEAN DEFAULT false,
    voucher_bedrooms INTEGER,
    voucher_city VARCHAR(100),
    voucher_amount DECIMAL(10,2),
    
    -- Additional Information
    message TEXT,
    previous_rental_history TEXT,
    references TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one application per tenant per property
    UNIQUE(property_id, tenant_id)
);

-- =============================================
-- MESSAGING SYSTEM  
-- =============================================

-- Messages table for landlord-tenant communication
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Conversation Context
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    application_id UUID REFERENCES applications(id) ON DELETE CASCADE,
    
    -- Participants
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Message Content
    subject VARCHAR(255),
    message_text TEXT NOT NULL,
    message_type VARCHAR(20) DEFAULT 'general' CHECK (message_type IN ('general', 'application', 'inquiry', 'maintenance', 'system')),
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- NOTIFICATIONS SYSTEM
-- =============================================

-- Notifications table for system notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Notification Content
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) DEFAULT 'info' CHECK (notification_type IN ('info', 'success', 'warning', 'error', 'application', 'message')),
    
    -- Links and Context
    related_property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    related_application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
    related_message_id UUID REFERENCES messages(id) ON DELETE SET NULL,
    action_url TEXT,
    
    -- Status
    is_read BOOLEAN DEFAULT false,
    
    -- Timestamps  
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Applications indexes
CREATE INDEX IF NOT EXISTS idx_applications_property_id ON applications(property_id);
CREATE INDEX IF NOT EXISTS idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX IF NOT EXISTS idx_applications_landlord_id ON applications(landlord_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_created_at ON applications(created_at DESC);

-- Messages indexes
CREATE INDEX IF NOT EXISTS idx_messages_property_id ON messages(property_id);
CREATE INDEX IF NOT EXISTS idx_messages_application_id ON messages(application_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================

-- Enable RLS
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Applications RLS Policies
CREATE POLICY "Applications are viewable by tenant and landlord" ON applications
    FOR SELECT USING (
        auth.uid() = tenant_id OR 
        auth.uid() = landlord_id
    );

CREATE POLICY "Tenants can create applications" ON applications
    FOR INSERT WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Landlords can update applications" ON applications
    FOR UPDATE USING (auth.uid() = landlord_id);

CREATE POLICY "Applications can be deleted by tenant or landlord" ON applications
    FOR DELETE USING (
        auth.uid() = tenant_id OR 
        auth.uid() = landlord_id
    );

-- Messages RLS Policies  
CREATE POLICY "Messages are viewable by sender and recipient" ON messages
    FOR SELECT USING (
        auth.uid() = sender_id OR 
        auth.uid() = recipient_id
    );

CREATE POLICY "Users can send messages" ON messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Recipients can update message read status" ON messages
    FOR UPDATE USING (auth.uid() = recipient_id);

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true); -- Allow system to create notifications

-- =============================================
-- FUNCTIONS FOR AUTOMATIC TIMESTAMPS
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for applications table
CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to get unread message count for a user
CREATE OR REPLACE FUNCTION get_unread_message_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM messages 
        WHERE recipient_id = user_uuid AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get unread notification count for a user
CREATE OR REPLACE FUNCTION get_unread_notification_count(user_uuid UUID)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM notifications 
        WHERE user_id = user_uuid AND is_read = false
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to mark message as read
CREATE OR REPLACE FUNCTION mark_message_as_read(message_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE messages 
    SET is_read = true, read_at = NOW()
    WHERE id = message_uuid AND recipient_id = user_uuid;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- EMAIL TEMPLATES (for reference)
-- =============================================

-- These will be used in the application logic, not stored in database
/*
Application Templates:
1. New Application Notification (to landlord)
2. Application Status Update (to tenant)
3. Message Notification (to recipient)
4. Contact Inquiry (to landlord)

Template Variables:
- {{tenant_name}}
- {{landlord_name}}
- {{property_title}}
- {{property_address}}
- {{application_status}}
- {{message_text}}
- {{sender_name}}
*/

-- Migration complete! 
-- Run this script in your Supabase SQL editor to set up the communication system.
