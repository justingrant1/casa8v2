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

### 4. Storage Setup
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
