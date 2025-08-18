#!/usr/bin/env tsx

/**
 * Migration Runner Script
 *
 * This script can run individual migration files or all pending migrations.
 * It's designed to work with AI agents and manual execution.
 */

import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

// Load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

interface MigrationFile {
  filename: string;
  version: string;
  content: string;
}

async function loadMigrationFiles(): Promise<MigrationFile[]> {
  const migrationsDir = path.resolve(process.cwd(), 'supabase/migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort(); // Ensure correct order

  return files.map((filename) => {
    const content = fs.readFileSync(
      path.join(migrationsDir, filename),
      'utf-8'
    );
    const version = filename.split('_')[0] || ''; // Extract version number
    return { filename, version, content };
  });
}

async function createMigrationTracker(supabase: any) {
  // Create a table to track which migrations have been run
  const { error } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS public._migrations (
        version TEXT PRIMARY KEY,
        filename TEXT NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW(),
        checksum TEXT
      );
    `,
  });

  if (error) {
    console.log('Creating migration tracker with direct SQL...');
    await supabase.from('_migrations').select('*').limit(1); // This will fail if table doesn't exist
  }
}

async function getExecutedMigrations(supabase: any): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('_migrations')
      .select('version');

    if (error) throw error;
    return data.map((row: any) => row.version);
  } catch {
    return []; // No migrations table yet
  }
}

async function executeMigration(
  supabase: any,
  migration: MigrationFile
): Promise<boolean> {
  console.log(`\n📝 Running migration: ${migration.filename}`);

  try {
    // Execute the migration SQL
    const { error: migrationError } = await supabase.rpc('exec_sql', {
      sql: migration.content,
    });

    if (migrationError) {
      // Try direct SQL if rpc fails
      const { error: directError } = await supabase
        .from('dummy_table_that_wont_exist')
        .select('*'); // This is just to test connection

      console.log('Using direct SQL execution...');
      // For AI agents, we'll provide the SQL to be executed via MCP
      return false;
    }

    // Record the migration
    await supabase.from('_migrations').insert({
      version: migration.version,
      filename: migration.filename,
    });

    console.log(`✅ Migration ${migration.filename} completed successfully`);
    return true;
  } catch (error) {
    console.log(`❌ Migration ${migration.filename} failed:`, error);
    return false;
  }
}

async function runMigrations(specificMigration?: string) {
  console.log('🛠️  Threadfolio V2 Migration Runner');
  console.log('====================================\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    console.log('❌ Missing required environment variables.');
    console.log('For AI agents: Use Supabase MCP server instead.');
    console.log('\nMigrations available for MCP execution:');

    const migrations = await loadMigrationFiles();
    migrations.forEach((migration) => {
      console.log(`\n--- ${migration.filename} ---`);
      console.log(migration.content.substring(0, 200) + '...');
    });
    return;
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  await createMigrationTracker(supabase);

  const migrations = await loadMigrationFiles();
  const executedMigrations = await getExecutedMigrations(supabase);

  if (specificMigration) {
    const migration = migrations.find(
      (m) => m.filename === specificMigration || m.version === specificMigration
    );

    if (!migration) {
      console.log(`❌ Migration '${specificMigration}' not found`);
      return;
    }

    await executeMigration(supabase, migration);
    return;
  }

  // Run all pending migrations
  const pendingMigrations = migrations.filter(
    (m) => !executedMigrations.includes(m.version)
  );

  if (pendingMigrations.length === 0) {
    console.log('✅ All migrations are up to date');
    return;
  }

  console.log(`📊 Found ${pendingMigrations.length} pending migrations\n`);

  for (const migration of pendingMigrations) {
    const success = await executeMigration(supabase, migration);
    if (!success) {
      console.log('❌ Migration failed. Stopping execution.');
      break;
    }
  }

  console.log('\n🎉 Migration run completed!');
}

// CLI usage
const specificMigration = process.argv[2];
runMigrations(specificMigration).catch(console.error);
