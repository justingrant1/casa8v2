-- =============================================
-- ADMIN ROLE AND USER CREATION
-- =============================================

-- This migration adds the 'admin' role to the profiles table and creates the initial admin user.

-- Add 'admin' to the role enum in the profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role TEXT;

-- Drop the old type if it exists
DROP TYPE IF EXISTS user_role;

-- Alter the 'role' column to be of type TEXT
ALTER TABLE public.profiles
ALTER COLUMN role TYPE TEXT;

-- Add a check constraint to ensure data integrity
ALTER TABLE public.profiles
ADD CONSTRAINT check_role CHECK (role IN ('tenant', 'landlord', 'admin'));

-- Create the admin user
-- This will be done in a separate step using the auth.signUp function to ensure the user is properly created in the auth schema.

-- Update RLS policies to grant admin full access
-- We will create a new policy for admins to bypass existing RLS.
CREATE POLICY "Allow admin full access"
ON public.profiles
FOR ALL
TO authenticated
USING (
  (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow admin full access on properties"
ON public.properties
FOR ALL
TO authenticated
USING (
  (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

CREATE POLICY "Allow admin full access on applications"
ON public.applications
FOR ALL
TO authenticated
USING (
  (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
);

-- =============================================
-- MIGRATION COMPLETE
-- =============================================
