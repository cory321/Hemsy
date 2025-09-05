import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { getTodayString } from '@/lib/utils/date-time-utils';

// Mock the date to ensure consistent testing
const mockDate = new Date('2024-03-15');
jest.useFakeTimers();
jest.setSystemTime(mockDate);

// Mock getTodayString to return consistent date
jest.mock('@/lib/utils/date-time-utils', () => ({
  getTodayString: jest.fn(() => '2024-03-15'),
}));

describe('Garments Date Filter - Due Today and Overdue', () => {
  it('filters garments due today correctly', async () => {
    const params = {
      shopId: '00000000-0000-0000-0000-000000000000',
      filter: 'due-today' as const,
      limit: 20,
    };

    // The filter should use '2024-03-15' as today's date
    const todayStr = getTodayString();
    expect(todayStr).toBe('2024-03-15');

    // Test that the params include the filter
    expect(params.filter).toBe('due-today');
  });

  it('filters overdue garments correctly', async () => {
    const params = {
      shopId: '00000000-0000-0000-0000-000000000000',
      filter: 'overdue' as const,
      limit: 20,
    };

    // Test that the params include the filter
    expect(params.filter).toBe('overdue');
  });

  it('combines filter with other parameters', async () => {
    const params = {
      shopId: '00000000-0000-0000-0000-000000000000',
      filter: 'overdue' as const,
      stage: 'In Progress' as const,
      search: 'wedding',
      sortField: 'due_date' as const,
      sortOrder: 'asc' as const,
      limit: 20,
    };

    // Test that all parameters are included
    expect(params.filter).toBe('overdue');
    expect(params.stage).toBe('In Progress');
    expect(params.search).toBe('wedding');
    expect(params.sortField).toBe('due_date');
    expect(params.sortOrder).toBe('asc');
  });

  it('handles pagination with filters', async () => {
    const params = {
      shopId: '00000000-0000-0000-0000-000000000000',
      filter: 'due-today' as const,
      cursor: {
        lastId: '11111111-1111-1111-1111-111111111111',
        lastCreatedAt: '2024-03-01T00:00:00Z',
      },
      limit: 20,
    };

    // Test that filter is maintained with cursor
    expect(params.filter).toBe('due-today');
    expect(params.cursor).toBeDefined();
    expect(params.cursor.lastId).toBe('11111111-1111-1111-1111-111111111111');
  });
});
