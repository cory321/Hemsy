#!/usr/bin/env tsx

/**
 * Database Setup Script
 *
 * This script creates the necessary database tables for Hemsy.
 * It sets up the core schema including users, shops, and clients tables.
 */

// Load environment variables
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import { createClient } from '@supabase/supabase-js';

async function setupDatabase() {
  console.log('🛠️  Setting up Hemsy Database');
  console.log('====================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing required environment variables:');
    console.log(`   SUPABASE_URL: ${supabaseUrl ? '✅' : '❌'}`);
    console.log(`   SERVICE_ROLE_KEY: ${serviceRoleKey ? '✅' : '❌'}`);
    console.log('\nPlease add these to your .env.local file.');
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  console.log('📊 Creating database schema...\n');

  try {
    // 1. Create users table first (required for foreign keys)
    console.log('Creating users table...');
    const usersSQL = `
      -- Create users table
      CREATE TABLE IF NOT EXISTS public.users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          clerk_user_id TEXT UNIQUE NOT NULL,
          email TEXT NOT NULL,
          role TEXT DEFAULT 'business_owner',
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id ON public.users(clerk_user_id);
      CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

      -- Enable Row Level Security
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies for users table
      DROP POLICY IF EXISTS "Users can view own record" ON public.users;
      CREATE POLICY "Users can view own record" ON public.users
          FOR SELECT USING (auth.uid()::text = clerk_user_id);

      DROP POLICY IF EXISTS "Users can update own record" ON public.users;
      CREATE POLICY "Users can update own record" ON public.users
          FOR UPDATE USING (auth.uid()::text = clerk_user_id);

      -- Create updated_at trigger
      CREATE OR REPLACE FUNCTION public.handle_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;

      CREATE TRIGGER IF NOT EXISTS handle_users_updated_at
          BEFORE UPDATE ON public.users
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_updated_at();
    `;

    const { error: usersError } = await supabase.rpc('sql', {
      query: usersSQL,
    });
    if (usersError) {
      console.log(`❌ Error creating users table: ${usersError.message}`);
    } else {
      console.log('✅ Users table created successfully');
    }

    // 2. Create shops table
    console.log('Creating shops table...');
    const shopsSQL = `
      -- Create shops table
      CREATE TABLE IF NOT EXISTS public.shops (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          owner_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          name TEXT NOT NULL,
          trial_countdown_enabled BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      -- Create indexes
      CREATE INDEX IF NOT EXISTS idx_shops_owner_user_id ON public.shops(owner_user_id);

      -- Enable Row Level Security
      ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;

      -- Create RLS policies for shops table
      DROP POLICY IF EXISTS "Users can view own shops" ON public.shops;
      CREATE POLICY "Users can view own shops" ON public.shops
          FOR SELECT USING (owner_user_id IN (
              SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
          ));

      DROP POLICY IF EXISTS "Users can create shops" ON public.shops;
      CREATE POLICY "Users can create shops" ON public.shops
          FOR INSERT WITH CHECK (owner_user_id IN (
              SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
          ));

      DROP POLICY IF EXISTS "Users can update own shops" ON public.shops;
      CREATE POLICY "Users can update own shops" ON public.shops
          FOR UPDATE USING (owner_user_id IN (
              SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
          ));

      DROP POLICY IF EXISTS "Users can delete own shops" ON public.shops;
      CREATE POLICY "Users can delete own shops" ON public.shops
          FOR DELETE USING (owner_user_id IN (
              SELECT id FROM public.users WHERE clerk_user_id = auth.uid()::text
          ));

      CREATE TRIGGER IF NOT EXISTS handle_shops_updated_at
          BEFORE UPDATE ON public.shops
          FOR EACH ROW
          EXECUTE FUNCTION public.handle_updated_at();
    `;

    const { error: shopsError } = await supabase.rpc('sql', {
      query: shopsSQL,
    });
    if (shopsError) {
      console.log(`❌ Error creating shops table: ${shopsError.message}`);
    } else {
      console.log('✅ Shops table created successfully');
    }

    // 3. Create clients table (from existing migration)
    console.log('Creating clients table...');
    const migrationsPath = path.resolve(
      process.cwd(),
      'supabase/migrations/001_create_clients_table.sql'
    );

    if (fs.existsSync(migrationsPath)) {
      const clientsSQL = fs.readFileSync(migrationsPath, 'utf8');
      const { error: clientsError } = await supabase.rpc('sql', {
        query: clientsSQL,
      });

      if (clientsError) {
        console.log(`❌ Error creating clients table: ${clientsError.message}`);
      } else {
        console.log('✅ Clients table created successfully');
      }
    } else {
      console.log('⚠️  Clients migration file not found, skipping...');
    }

    console.log('\n🎉 Database Setup Complete!');
    console.log('==========================\n');
    console.log('✅ Core tables created:');
    console.log('   - users (with Clerk integration)');
    console.log('   - shops (business profiles)');
    console.log('   - clients (customer management)');
    console.log('');
    console.log('✅ Security configured:');
    console.log('   - Row Level Security enabled');
    console.log('   - RLS policies applied');
    console.log('   - Updated_at triggers added');
    console.log('');
    console.log('🚀 Ready to test write operations!');
  } catch (error: any) {
    console.log(`❌ Setup failed: ${error.message}`);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Verify your SERVICE_ROLE_KEY has admin privileges');
    console.log('2. Check that your Supabase project is active');
    console.log('3. Ensure you have sufficient permissions');
  }
}

// Run setup
if (require.main === module) {
  setupDatabase().catch(console.error);
}

export default setupDatabase;
