# Database Setup Instructions

## Supabase Project Details
- **Project Name**: casa8-rental-platform
- **Project ID**: ylhkoromgjhapjpagvxg
- **Project URL**: https://ylhkoromgjhapjpagvxg.supabase.co

## Quick Setup Steps

1. **Access your Supabase Dashboard**:
   - Go to https://supabase.com/dashboard
   - Open your "casa8-rental-platform" project

2. **Create Tables**:
   - Navigate to SQL Editor
   - Run the SQL commands below in order

## Required SQL Commands

### 1. Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL CHECK (role IN ('tenant', 'landlord')),
  phone TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
```

### 2. Properties Table
```sql
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  price DECIMAL NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms DECIMAL NOT NULL,
  square_feet INTEGER,
  property_type TEXT NOT NULL,
  amenities TEXT[],
  available BOOLEAN DEFAULT true,
  landlord_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  available_date DATE,
  security_deposit NUMERIC,
  pet_policy TEXT,
  contact_phone TEXT,
  allow_chat BOOLEAN DEFAULT true
);

ALTER TABLE properties ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view available properties" ON properties FOR SELECT USING (available = true);
CREATE POLICY "Landlords can manage their properties" ON properties FOR ALL USING (auth.uid() = landlord_id);
```

### 3. Property Images & Favorites Tables
```sql
CREATE TABLE property_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE user_favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, property_id)
);

ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view property images" ON property_images FOR SELECT USING (true);
CREATE POLICY "Landlords can insert images for their properties" ON property_images FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM properties WHERE properties.id = property_images.property_id AND properties.landlord_id = auth.uid()));
CREATE POLICY "Users can manage their favorites" ON user_favorites FOR ALL USING (auth.uid() = user_id);
```

### 4. Applications Table (Required for tenant applications)
```sql
CREATE TABLE applications (
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
    ref_text TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one application per tenant per property
    UNIQUE(property_id, tenant_id)
);

-- Add indexes for better performance
CREATE INDEX idx_applications_property_id ON applications(property_id);
CREATE INDEX idx_applications_tenant_id ON applications(tenant_id);
CREATE INDEX idx_applications_landlord_id ON applications(landlord_id);
CREATE INDEX idx_applications_status ON applications(status);
CREATE INDEX idx_applications_created_at ON applications(created_at DESC);

-- Enable Row Level Security
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for applications
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
```

### 5. Messages Table (Required for landlord-tenant communication)
```sql
CREATE TABLE messages (
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

-- Messages indexes
CREATE INDEX idx_messages_property_id ON messages(property_id);
CREATE INDEX idx_messages_application_id ON messages(application_id);
CREATE INDEX idx_messages_sender_id ON messages(sender_id);
CREATE INDEX idx_messages_recipient_id ON messages(recipient_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX idx_messages_unread ON messages(recipient_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

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
```

### 6. Notifications Table (Required for system notifications)
```sql
CREATE TABLE notifications (
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

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_unread ON notifications(user_id, is_read) WHERE is_read = false;

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Notifications RLS Policies
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can create notifications" ON notifications
    FOR INSERT WITH CHECK (true);
```

### 7. Storage Setup
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('property-images', 'property-images', true);

create policy "Allow authenticated users to upload to property-images"
on storage.objects for insert
with check (bucket_id = 'property-images' and auth.role() = 'authenticated');
```

## Environment Variables
Your `.env.local` file should contain:
```
NEXT_PUBLIC_SUPABASE_URL=https://ylhkoromgjhapjpagvxg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Test Your Setup
After running these commands, you can test the authentication by running:
```bash
npm run dev
```

Then visit http://localhost:3000 and try to register/login.
