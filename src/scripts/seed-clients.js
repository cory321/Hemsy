require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use service role key to bypass RLS for seeding
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo data arrays
const firstNames = [
  'John',
  'Jane',
  'Michael',
  'Sarah',
  'David',
  'Emily',
  'James',
  'Ashley',
  'Robert',
  'Jessica',
  'William',
  'Amanda',
  'Christopher',
  'Lisa',
  'Daniel',
  'Michelle',
  'Matthew',
  'Kimberly',
  'Anthony',
  'Angela',
  'Mark',
  'Laura',
  'Donald',
  'Rebecca',
  'Steven',
  'Sharon',
  'Paul',
  'Cynthia',
  'Andrew',
  'Kathleen',
  'Joshua',
  'Amy',
  'Kenneth',
  'Angela',
  'Kevin',
  'Brenda',
  'Brian',
  'Emma',
  'George',
  'Olivia',
  'Timothy',
  'Stephanie',
  'Ronald',
  'Dorothy',
  'Jason',
  'Carol',
  'Edward',
  'Ruth',
  'Jeffrey',
  'Sharon',
];

const lastNames = [
  'Smith',
  'Johnson',
  'Williams',
  'Brown',
  'Jones',
  'Garcia',
  'Miller',
  'Davis',
  'Rodriguez',
  'Martinez',
  'Hernandez',
  'Lopez',
  'Gonzalez',
  'Wilson',
  'Anderson',
  'Thomas',
  'Taylor',
  'Moore',
  'Jackson',
  'Martin',
  'Lee',
  'Perez',
  'Thompson',
  'White',
  'Harris',
  'Sanchez',
  'Clark',
  'Ramirez',
  'Lewis',
  'Robinson',
  'Walker',
  'Young',
  'Allen',
  'King',
  'Wright',
  'Scott',
  'Torres',
  'Nguyen',
  'Hill',
  'Flores',
  'Green',
  'Adams',
  'Nelson',
  'Baker',
  'Hall',
  'Rivera',
  'Campbell',
  'Mitchell',
  'Carter',
  'Roberts',
];

const emailDomains = [
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'email.com',
  'example.com',
];

const sampleNotes = [
  'Preferred customer - always punctual',
  'Likes to book appointments in advance',
  'VIP client with special requests',
  'Regular customer since 2020',
  'Prefers morning appointments',
  'Great referral source',
  'Cash payments only',
  'Sensitive skin - use gentle products',
  'Loyal customer - very satisfied',
  'Prefers text communication',
];

const sampleAddresses = [
  '123 Main St, Anytown, ST 12345',
  '456 Oak Ave, Downtown, ST 67890',
  '789 Pine Rd, Suburbia, ST 11111',
  '321 Elm St, Midtown, ST 22222',
  '654 Maple Dr, Uptown, ST 33333',
  '987 Cedar Ln, Riverside, ST 44444',
  '147 Birch Way, Hillside, ST 55555',
  '258 Willow Ct, Lakeside, ST 66666',
  '369 Spruce Blvd, Parkside, ST 77777',
  '741 Aspen Path, Countryside, ST 88888',
];

function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generatePhoneNumber() {
  const areaCode = Math.floor(Math.random() * 900) + 100;
  const exchange = Math.floor(Math.random() * 900) + 100;
  const number = Math.floor(Math.random() * 9000) + 1000;
  return `(${areaCode}) ${exchange}-${number}`;
}

function generateEmail(firstName, lastName) {
  const domain = getRandomItem(emailDomains);
  const emailUsername = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 100)}`;
  return `${emailUsername}@${domain}`;
}

async function seedClients() {
  try {
    console.log('🌱 Starting client seeding process...');

    // Get the existing shop ID
    const { data: shops, error: shopError } = await supabase
      .from('shops')
      .select('id')
      .limit(1)
      .single();

    if (shopError) {
      console.error('Error fetching shop:', shopError);
      return;
    }

    if (!shops) {
      console.error('No shops found. Please create a shop first.');
      return;
    }

    const shopId = shops.id;
    console.log(`📍 Using shop ID: ${shopId}`);

    // Generate 100 demo clients
    const clients = [];
    for (let i = 0; i < 100; i++) {
      const firstName = getRandomItem(firstNames);
      const lastName = getRandomItem(lastNames);

      const client = {
        shop_id: shopId,
        first_name: firstName,
        last_name: lastName,
        email: generateEmail(firstName, lastName),
        phone_number: generatePhoneNumber(),
        accept_email: Math.random() > 0.3, // 70% accept email
        accept_sms: Math.random() > 0.5, // 50% accept SMS
        notes: Math.random() > 0.4 ? getRandomItem(sampleNotes) : null, // 60% have notes
        mailing_address:
          Math.random() > 0.6 ? getRandomItem(sampleAddresses) : null, // 40% have address
      };

      clients.push(client);
    }

    console.log('📝 Generated 100 demo clients, inserting into database...');

    // Insert clients in batches of 10 to avoid overwhelming the database
    const batchSize = 10;
    let insertedCount = 0;

    for (let i = 0; i < clients.length; i += batchSize) {
      const batch = clients.slice(i, i + batchSize);

      const { error } = await supabase.from('clients').insert(batch);

      if (error) {
        console.error(
          `Error inserting batch ${Math.floor(i / batchSize) + 1}:`,
          error
        );
        break;
      }

      insertedCount += batch.length;
      console.log(
        `✅ Inserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(clients.length / batchSize)} (${insertedCount} clients)`
      );
    }

    console.log(`🎉 Successfully seeded ${insertedCount} clients!`);

    // Verify the count
    const { count, error: countError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true })
      .eq('shop_id', shopId);

    if (!countError) {
      console.log(`📊 Total clients in database for this shop: ${count}`);
    }
  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

// Run the seeding function
if (require.main === module) {
  seedClients()
    .then(() => {
      console.log('🏁 Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seedClients };
