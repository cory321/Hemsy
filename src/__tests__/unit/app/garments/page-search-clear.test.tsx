import React from 'react';
import {
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider, useAuth, useUser } from '@clerk/nextjs';
import GarmentsClient from '@/app/(app)/garments/garments-client';
import { getCurrentUserShop } from '@/lib/actions/shops';
import { getGarmentsPaginated } from '@/lib/actions/garments-paginated';
import { GARMENT_STAGES } from '@/constants/garmentStages';
import userEvent from '@testing-library/user-event';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

// Mock modules
jest.mock('@clerk/nextjs', () => ({
  ClerkProvider: ({ children }: { children: React.ReactNode }) => children,
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

jest.mock('@/lib/actions/shops');
jest.mock('@/lib/actions/garments-paginated');
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  usePathname: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock MUI media query
let mockIsMobile = false;
jest.mock('@mui/material/useMediaQuery', () => ({
  __esModule: true,
  default: jest.fn(() => mockIsMobile),
}));

describe('GarmentsPage - Search Clear on Stage Change', () => {
  let queryClient: QueryClient;

  const mockShop = { id: 'shop-123', name: 'Test Shop' };
  const mockGarmentsResponse = {
    garments: [
      {
        id: 'g1',
        name: 'Test Shirt',
        stage_name: 'New',
        order_id: 'order-1',
        client_name: 'John Doe',
        due_date: '2024-01-01',
        created_at: '2023-12-01',
      },
    ],
    totalCount: 1,
    stageCounts: { New: 1 },
    nextCursor: null,
    hasMore: false,
  };

  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  } as any;

  beforeEach(() => {
    // Reset mobile mock to desktop by default
    mockIsMobile = false;

    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    // Mock auth
    (useAuth as jest.Mock).mockReturnValue({
      userId: 'user-123',
      isLoaded: true,
    });
    (useUser as jest.Mock).mockReturnValue({
      user: { id: 'user-123' },
      isLoaded: true,
    });

    // Mock shop and garments
    (getCurrentUserShop as jest.Mock).mockResolvedValue(mockShop);
    (getGarmentsPaginated as jest.Mock).mockResolvedValue(mockGarmentsResponse);

    // Router hooks for client component
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (usePathname as jest.Mock).mockReturnValue('/garments');
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockIsMobile = false; // Reset to desktop
  });

  it('should clear search when clicking a stage box', async () => {
    render(
      <GarmentsClient
        initialData={mockGarmentsResponse as any}
        stageCounts={{
          New: 1,
          'In Progress': 0,
          'Ready For Pickup': 0,
          Done: 0,
        }}
        shopId="shop-123"
        initialFilters={{ sortField: 'created_at', sortOrder: 'desc' }}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          'Search garments by name, notes, or client name...'
        )
      ).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(
      'Search garments by name, notes, or client name...'
    ) as HTMLInputElement;
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    expect(searchInput.value).toBe('test search');

    // Click on "View All" stage
    const viewAllStage = screen.getByText('View All');
    fireEvent.click(viewAllStage);

    // Search should be cleared
    expect(searchInput.value).toBe('');
  });

  it('should clear search when selecting stage from mobile dropdown', async () => {
    // Set mobile view
    mockIsMobile = true;
    const user = userEvent.setup();

    render(
      <GarmentsClient
        initialData={mockGarmentsResponse as any}
        stageCounts={{
          New: 1,
          'In Progress': 0,
          'Ready For Pickup': 0,
          Done: 0,
        }}
        shopId="shop-123"
        initialFilters={{ sortField: 'created_at', sortOrder: 'desc' }}
      />
    );

    // Wait for initial load
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          'Search garments by name, notes, or client name...'
        )
      ).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(
      'Search garments by name, notes, or client name...'
    ) as HTMLInputElement;
    await user.type(searchInput, 'mobile search');
    expect(searchInput.value).toBe('mobile search');

    // Find and click the stage select dropdown (first combobox)
    const selectDropdowns = screen.getAllByRole('combobox');
    const stageDropdown = selectDropdowns[0]; // First is stage, second is sort
    if (stageDropdown) {
      await user.click(stageDropdown);
    }

    // Wait for dropdown menu to open and click the New option
    const listbox = await screen.findByRole('listbox');
    const newOption = within(listbox).getByText(/New \(1\)/);
    await user.click(newOption);

    // Search should be cleared
    await waitFor(() => {
      expect(searchInput.value).toBe('');
    });
  });

  it('should clear search when switching between different stages', async () => {
    // Ensure desktop view
    mockIsMobile = false;

    // Mock response with multiple stages
    const multiStageResponse = {
      ...mockGarmentsResponse,
      stageCounts: {
        New: 1,
        'In Progress': 2,
        'Ready For Pickup': 3,
        Done: 1,
      },
    };
    (getGarmentsPaginated as jest.Mock).mockResolvedValue(multiStageResponse);

    render(
      <GarmentsClient
        initialData={multiStageResponse as any}
        stageCounts={multiStageResponse.stageCounts}
        shopId="shop-123"
        initialFilters={{ sortField: 'created_at', sortOrder: 'desc' }}
      />
    );

    // Wait for initial load and stage boxes
    await waitFor(() => {
      expect(
        screen.getByPlaceholderText(
          'Search garments by name, notes, or client name...'
        )
      ).toBeInTheDocument();
      // Check that stage boxes are rendered
      const newStageBox = screen.getByText('New');
      expect(newStageBox).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(
      'Search garments by name, notes, or client name...'
    ) as HTMLInputElement;

    // Type search and click New stage
    fireEvent.change(searchInput, { target: { value: 'first search' } });
    expect(searchInput.value).toBe('first search');

    const newStage = screen.getByText('New');
    fireEvent.click(newStage);
    expect(searchInput.value).toBe('');

    // Type another search and click In Progress stage
    fireEvent.change(searchInput, { target: { value: 'second search' } });
    expect(searchInput.value).toBe('second search');

    const inProgressStage = screen.getByText('In Progress');
    fireEvent.click(inProgressStage);
    expect(searchInput.value).toBe('');
  });
});
