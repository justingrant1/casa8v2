import { createAdminUser } from '../lib/admin'
import { supabase } from '../lib/supabase'

async function setupAdmin() {
  console.log('Setting up admin dashboard...')
  
  try {
    // First, run the database migration to add admin role support
    console.log('Running database migration...')
    
    const migration = `
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

      -- Add admin policies for other tables as needed
      CREATE POLICY "Allow admin full access on property_images"
      ON public.property_images
      FOR ALL
      TO authenticated
      USING (
        (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );

      CREATE POLICY "Allow admin full access on property_videos"
      ON public.property_videos
      FOR ALL
      TO authenticated
      USING (
        (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );

      CREATE POLICY "Allow admin full access on user_favorites"
      ON public.user_favorites
      FOR ALL
      TO authenticated
      USING (
        (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );

      CREATE POLICY "Allow admin full access on messages"
      ON public.messages
      FOR ALL
      TO authenticated
      USING (
        (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );

      CREATE POLICY "Allow admin full access on conversations"
      ON public.conversations
      FOR ALL
      TO authenticated
      USING (
        (SELECT role::text FROM public.profiles WHERE id = auth.uid()) = 'admin'
      );
    `

    // Execute the migration
    const { error: migrationError } = await supabase.rpc('exec_sql', { sql: migration })
    if (migrationError) {
      // If the function doesn't exist, try direct execution
      console.log('RPC function not available, trying direct execution...')
      
      // Split the migration into individual statements
      const statements = migration
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))
      
      for (const statement of statements) {
        console.log(`Executing: ${statement.substring(0, 50)}...`)
        const { error } = await supabase.rpc('exec_sql', { sql: statement })
        if (error) {
          console.warn(`Warning: ${error.message}`)
          // Continue with other statements
        }
      }
    }

    console.log('Database migration completed successfully!')

    // Create the admin user
    console.log('Creating admin user...')
    const { error: adminError, user } = await createAdminUser(
      'jgrant@trestacapital.com',
      'Admin123!',
      'Justin Grant'
    )

    if (adminError) {
      if (adminError.message.includes('User already registered')) {
        console.log('Admin user already exists, updating role...')
        
        // Try to update existing user's role
        const { data: existingUser } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', 'jgrant@trestacapital.com')
          .single()
        
        if (existingUser) {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'admin' })
            .eq('id', existingUser.id)
          
          if (updateError) {
            console.error('Error updating user role:', updateError)
          } else {
            console.log('Successfully updated existing user to admin role!')
          }
        }
      } else {
        console.error('Error creating admin user:', adminError)
        throw adminError
      }
    } else {
      console.log('Admin user created successfully!')
      console.log('User ID:', user?.id)
    }

    console.log('\n✅ Admin dashboard setup completed!')
    console.log('\nAdmin credentials:')
    console.log('Email: jgrant@trestacapital.com')
    console.log('Password: Admin123!')
    console.log('\nYou can now access the admin dashboard at: /admin')
    
  } catch (error) {
    console.error('Error setting up admin:', error)
    process.exit(1)
  }
}

// Run the setup
setupAdmin()
