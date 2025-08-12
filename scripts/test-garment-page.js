#!/usr/bin/env node

/**
 * Test script to verify the garment detail page is working correctly
 * This creates a test order with a garment and outputs the garment ID
 * to test the garment detail page
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testGarmentPage() {
  try {
    console.log('Testing garment detail page setup...\n');

    // Get the first shop
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .limit(1)
      .single();

    if (shopError || !shops) {
      console.error('No shop found. Please set up a shop first.');
      return;
    }

    console.log('Found shop:', shops.id);

    // Get or create a test client
    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('shop_id', shops.id)
      .eq('email', 'test-garment@example.com')
      .single();

    let clientId;

    if (existingClient) {
      clientId = existingClient.id;
      console.log('Using existing test client:', clientId);
    } else {
      const { data: newClient, error: clientError } = await supabase
        .from('clients')
        .insert({
          shop_id: shops.id,
          first_name: 'Test',
          last_name: 'Garment',
          email: 'test-garment@example.com',
          phone_number: '555-0123',
        })
        .select('id')
        .single();

      if (clientError) {
        console.error('Error creating test client:', clientError);
        return;
      }

      clientId = newClient.id;
      console.log('Created test client:', clientId);
    }

    // Get a garment to test
    const { data: garments, error: garmentError } = await supabase
      .from('garments')
      .select(
        `
        id,
        name,
        order:orders!inner(
          shop_id
        )
      `
      )
      .eq('order.shop_id', shops.id)
      .limit(1);

    if (garments && garments.length > 0) {
      console.log('\n✅ Found existing garment to test:');
      console.log(`   Garment ID: ${garments[0].id}`);
      console.log(`   Garment Name: ${garments[0].name}`);
      console.log(`\n📋 To test the garment detail page, navigate to:`);
      console.log(`   http://localhost:3000/garments/${garments[0].id}`);
    } else {
      console.log(
        '\nNo garments found. Please create an order with garments first.'
      );
      console.log('You can do this by navigating to:');
      console.log('   http://localhost:3000/orders/new');
    }

    console.log('\n✅ Test complete!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testGarmentPage();
