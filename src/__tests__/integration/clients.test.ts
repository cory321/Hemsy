import {
  getClients,
  createClient,
  updateClient,
  deleteClient,
} from '@/lib/actions/clients';

// This is an integration test that requires a test database
// Skip in CI unless TEST_DATABASE_URL is set
const skipIfNoDatabase = process.env.TEST_DATABASE_URL
  ? describe
  : describe.skip;

skipIfNoDatabase('Clients Integration Tests', () => {
  let testClientId: string;

  beforeAll(async () => {
    // Set up test user and shop in database
    // This would typically be done in a test setup script
  });

  afterAll(async () => {
    // Clean up test data
    if (testClientId) {
      try {
        await deleteClient(testClientId);
      } catch {
        // Ignore errors during cleanup
      }
    }
  });

  it('should create, read, update, and delete a client', async () => {
    // Create a client
    const newClientData = {
      first_name: 'Test',
      last_name: 'Client',
      email: 'test@example.com',
      phone_number: '5551234567',
      accept_email: true,
      accept_sms: false,
      notes: 'Integration test client',
      mailing_address: '123 Test St',
    };

    const createdClient = await createClient(newClientData);
    testClientId = createdClient.id;

    expect(createdClient).toMatchObject(newClientData);
    expect(createdClient.id).toBeDefined();
    expect(createdClient.shop_id).toBeDefined();

    // Read clients
    const clients = await getClients(1, 10);
    expect(clients.data).toContainEqual(
      expect.objectContaining({
        id: testClientId,
        first_name: 'Test',
        last_name: 'Client',
      })
    );

    // Update the client
    const updates = {
      first_name: 'Updated',
      notes: 'Updated notes',
    };

    const updatedClient = await updateClient(testClientId, updates);
    expect(updatedClient.first_name).toBe('Updated');
    expect(updatedClient.notes).toBe('Updated notes');

    // Delete the client
    await deleteClient(testClientId);

    // Verify deletion
    const clientsAfterDelete = await getClients(1, 10);
    expect(clientsAfterDelete.data).not.toContainEqual(
      expect.objectContaining({ id: testClientId })
    );
  });

  it('should handle pagination correctly', async () => {
    // Create multiple test clients
    const clientPromises = Array.from({ length: 15 }, (_, i) =>
      createClient({
        first_name: `Test${i}`,
        last_name: 'PaginationClient',
        email: `test${i}@example.com`,
        phone_number: `555${i.toString().padStart(7, '0')}`,
        accept_email: true,
        accept_sms: false,
        notes: null,
        mailing_address: null,
      })
    );

    const createdClients = await Promise.all(clientPromises);
    const clientIds = createdClients.map((c) => c.id);

    try {
      // Test first page
      const page1 = await getClients(1, 10);
      expect(page1.data.length).toBe(10);
      expect(page1.totalPages).toBeGreaterThanOrEqual(2);

      // Test second page
      const page2 = await getClients(2, 10);
      expect(page2.data.length).toBeGreaterThan(0);

      // Ensure no overlap between pages
      const page1Ids = page1.data.map((c) => c.id);
      const page2Ids = page2.data.map((c) => c.id);
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap.length).toBe(0);
    } finally {
      // Clean up
      await Promise.all(clientIds.map((id) => deleteClient(id)));
    }
  });

  it('should filter clients by search term', async () => {
    // Create test clients with specific names
    const client1 = await createClient({
      first_name: 'Unique',
      last_name: 'Searchname',
      email: 'unique@example.com',
      phone_number: '5559999999',
      accept_email: true,
      accept_sms: false,
      notes: null,
      mailing_address: null,
    });

    const client2 = await createClient({
      first_name: 'Different',
      last_name: 'Person',
      email: 'different@example.com',
      phone_number: '5558888888',
      accept_email: true,
      accept_sms: false,
      notes: null,
      mailing_address: null,
    });

    try {
      // Search by name
      const searchResults = await getClients(1, 10, { search: 'Unique' });
      expect(searchResults.data).toContainEqual(
        expect.objectContaining({ id: client1.id })
      );
      expect(searchResults.data).not.toContainEqual(
        expect.objectContaining({ id: client2.id })
      );

      // Search by email
      const emailResults = await getClients(1, 10, { search: 'different@' });
      expect(emailResults.data).toContainEqual(
        expect.objectContaining({ id: client2.id })
      );
      expect(emailResults.data).not.toContainEqual(
        expect.objectContaining({ id: client1.id })
      );
    } finally {
      // Clean up
      await deleteClient(client1.id);
      await deleteClient(client2.id);
    }
  });
});
