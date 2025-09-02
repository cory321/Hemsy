import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useAuth, useUser } from '@clerk/nextjs';
import GarmentsPage from '@/app/(app)/garments/page';
import { getCurrentUserShop } from '@/lib/actions/shops';
import { useGarmentsSearch } from '@/lib/queries/garment-queries';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
  usePathname: jest.fn(),
}));

// Mock Clerk
jest.mock('@clerk/nextjs', () => ({
  useAuth: jest.fn(),
  useUser: jest.fn(),
}));

// Mock actions and queries
jest.mock('@/lib/actions/shops', () => ({
  getCurrentUserShop: jest.fn(),
}));

jest.mock('@/lib/queries/garment-queries', () => ({
  useGarmentsSearch: jest.fn(),
}));

// Mock GarmentCard
jest.mock('@/components/garments/GarmentCard', () => ({
  __esModule: true,
  default: ({ garment }: any) => (
    <div data-testid={`garment-card-${garment.id}`}>{garment.name}</div>
  ),
}));

// Mock StageBox
jest.mock('@/components/garments/StageBox', () => ({
  __esModule: true,
  default: ({ stage, onClick, isSelected }: any) => (
    <div
      data-testid={`stage-box-${stage.name.toLowerCase().replace(/\s+/g, '-')}`}
      data-selected={isSelected}
      onClick={onClick}
    >
      {stage.name} ({stage.count})
    </div>
  ),
}));

// Mock MUI components
jest.mock('@mui/material', () => ({
  ...jest.requireActual('@mui/material'),
  useTheme: () => ({ breakpoints: { down: () => false } }),
  useMediaQuery: () => false,
}));

jest.mock('@mui/material/Grid2', () => ({
  __esModule: true,
  default: ({ children, ...props }: any) => (
    <div data-testid="grid2" {...props}>
      {children}
    </div>
  ),
}));

// Mock components
jest.mock('@/components/garments/GarmentCard', () => {
  return function MockGarmentCard({ garment }: any) {
    return <div data-testid="garment-card">{garment.name}</div>;
  };
});

jest.mock('@/components/garments/StageBox', () => {
  return function MockStageBox({ stage, onClick, isSelected }: any) {
    return (
      <button
        data-testid={`stage-box-${stage.name.toLowerCase().replace(/\s+/g, '-')}`}
        onClick={onClick}
        data-selected={isSelected}
      >
        {stage.name} ({stage.count})
      </button>
    );
  };
});

jest.mock('@/components/common/InfiniteScrollTrigger', () => ({
  InfiniteScrollTrigger: function MockInfiniteScrollTrigger() {
    return <div data-testid="infinite-scroll-trigger" />;
  },
}));

describe('GarmentsPage URL Parameters', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
    refresh: jest.fn(),
  };

  const mockSearchParams = new URLSearchParams();
  const mockShop = { id: 'shop-123' };
  const mockGarments = [
    {
      id: '1',
      name: 'Test Garment 1',
      stage_name: 'New',
      order_id: 'order-1',
      client_name: 'Client A',
    },
    {
      id: '2',
      name: 'Test Garment 2',
      stage_name: 'In Progress',
      order_id: 'order-2',
      client_name: 'Client B',
    },
  ];

  const defaultGarmentsSearchReturn = {
    garments: mockGarments,
    totalCount: 2,
    totalGarmentsCount: 2,
    stageCounts: {
      New: 1,
      'In Progress': 1,
      'Ready For Pickup': 0,
      Done: 0,
    },
    isLoading: false,
    isFetching: false,
    isError: false,
    error: null,
    fetchNextPage: jest.fn(),
    hasNextPage: false,
    isFetchingNextPage: false,
    search: '',
    setSearch: jest.fn(),
    filters: {},
    setFilters: jest.fn(),
    prefetchNextPage: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    // Set default empty searchParams - individual tests can override
    (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
    (usePathname as jest.Mock).mockReturnValue('/garments');
    (useAuth as jest.Mock).mockReturnValue({ userId: 'user-123' });
    (useUser as jest.Mock).mockReturnValue({ user: { id: 'user-123' } });
    (getCurrentUserShop as jest.Mock).mockResolvedValue(mockShop);
    (useGarmentsSearch as jest.Mock).mockReturnValue(
      defaultGarmentsSearchReturn
    );
  });

  describe('URL to Stage Mapping', () => {
    it('should load "New" stage when URL has stage=new', async () => {
      const searchParams = new URLSearchParams('stage=new');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(useGarmentsSearch).toHaveBeenCalledWith(
          'shop-123',
          expect.objectContaining({
            stage: 'New',
          }),
          expect.any(Object)
        );
      });
    });

    it('should load "In Progress" stage when URL has stage=in-progress', async () => {
      const searchParams = new URLSearchParams('stage=in-progress');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(useGarmentsSearch).toHaveBeenCalledWith(
          'shop-123',
          expect.objectContaining({
            stage: 'In Progress',
          }),
          expect.any(Object)
        );
      });
    });

    it('should load "Ready For Pickup" stage when URL has stage=ready-for-pickup', async () => {
      const searchParams = new URLSearchParams('stage=ready-for-pickup');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(useGarmentsSearch).toHaveBeenCalledWith(
          'shop-123',
          expect.objectContaining({
            stage: 'Ready For Pickup',
          }),
          expect.any(Object)
        );
      });
    });

    it('should load "Done" stage when URL has stage=done', async () => {
      const searchParams = new URLSearchParams('stage=done');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(useGarmentsSearch).toHaveBeenCalledWith(
          'shop-123',
          expect.objectContaining({
            stage: 'Done',
          }),
          expect.any(Object)
        );
      });
    });

    it('should load all garments when URL has no stage parameter', async () => {
      const searchParams = new URLSearchParams('');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(useGarmentsSearch).toHaveBeenCalledWith(
          'shop-123',
          expect.objectContaining({
            stage: null,
          }),
          expect.any(Object)
        );
      });
    });

    it('should handle invalid stage parameter gracefully', async () => {
      const searchParams = new URLSearchParams('stage=invalid-stage');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(useGarmentsSearch).toHaveBeenCalledWith(
          'shop-123',
          expect.objectContaining({
            stage: null,
          }),
          expect.any(Object)
        );
      });
    });
  });

  describe('Stage to URL Updates', () => {
    it('should update URL when clicking "New" stage', async () => {
      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-new')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-new'));

      expect(mockRouter.replace).toHaveBeenCalledWith('/garments?stage=new');
    });

    it('should update URL when clicking "In Progress" stage', async () => {
      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-in-progress')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-in-progress'));

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/garments?stage=in-progress'
      );
    });

    it('should update URL when clicking "Ready For Pickup" stage', async () => {
      render(<GarmentsPage />);

      await waitFor(() => {
        expect(
          screen.getByTestId('stage-box-ready-for-pickup')
        ).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-ready-for-pickup'));

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/garments?stage=ready-for-pickup'
      );
    });

    it('should update URL when clicking "Done" stage', async () => {
      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-done')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-done'));

      expect(mockRouter.replace).toHaveBeenCalledWith('/garments?stage=done');
    });

    it('should clear stage parameter when clicking "View All"', async () => {
      const searchParams = new URLSearchParams('stage=new');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-view-all')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-view-all'));

      expect(mockRouter.replace).toHaveBeenCalledWith('/garments');
    });
  });

  describe('Mobile Stage Selection', () => {
    beforeEach(() => {
      // Mock mobile view
      jest.doMock('@mui/material', () => ({
        ...jest.requireActual('@mui/material'),
        useTheme: () => ({ breakpoints: { down: () => true } }),
        useMediaQuery: () => true,
      }));
    });

    it.skip('should update URL when selecting stage from dropdown on mobile', async () => {
      // Force re-import to apply mobile mock
      jest.resetModules();

      // Re-setup all the mocks before importing the module
      const {
        useRouter,
        useSearchParams,
        usePathname,
      } = require('next/navigation');
      const { useAuth, useUser } = require('@clerk/nextjs');
      const { getCurrentUserShop } = require('@/lib/actions/shops');
      const { useGarmentsSearch } = require('@/lib/queries/garment-queries');

      (useRouter as jest.Mock).mockReturnValue(mockRouter);
      (useSearchParams as jest.Mock).mockReturnValue(new URLSearchParams());
      (usePathname as jest.Mock).mockReturnValue('/garments');
      (useAuth as jest.Mock).mockReturnValue({ userId: 'user-123' });
      (useUser as jest.Mock).mockReturnValue({ user: { id: 'user-123' } });
      (getCurrentUserShop as jest.Mock).mockResolvedValue(mockShop);
      (useGarmentsSearch as jest.Mock).mockReturnValue(
        defaultGarmentsSearchReturn
      );

      const { default: MobileGarmentsPage } = await import(
        '@/app/(app)/garments/page'
      );

      render(<MobileGarmentsPage />);

      await waitFor(() => {
        expect(screen.getByLabelText('Stage')).toBeInTheDocument();
      });

      const select = screen.getByLabelText('Stage');
      fireEvent.change(select, { target: { value: 'In Progress' } });

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/garments?stage=in-progress'
      );
    });
  });

  describe('URL Navigation', () => {
    it('should use router.replace instead of router.push to avoid history clutter', async () => {
      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-new')).toBeInTheDocument();
      });

      // Click through multiple stages
      fireEvent.click(screen.getByTestId('stage-box-new'));
      fireEvent.click(screen.getByTestId('stage-box-in-progress'));
      fireEvent.click(screen.getByTestId('stage-box-done'));

      // All calls should use replace, not push
      expect(mockRouter.replace).toHaveBeenCalledTimes(3);
      expect(mockRouter.push).not.toHaveBeenCalled();
    });

    it('should preserve other query parameters when updating stage', async () => {
      const searchParams = new URLSearchParams('sort=name&order=asc');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-new')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-new'));

      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/garments?sort=name&order=asc&stage=new'
      );
    });
  });

  describe('Search Reset', () => {
    it('should clear search when changing stage', async () => {
      const setSearch = jest.fn();
      (useGarmentsSearch as jest.Mock).mockReturnValue({
        ...defaultGarmentsSearchReturn,
        search: 'test search',
        setSearch,
      });

      render(<GarmentsPage />);

      await waitFor(() => {
        expect(screen.getByTestId('stage-box-new')).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('stage-box-new'));

      expect(setSearch).toHaveBeenCalledWith('');
    });
  });

  describe('Stage Selection Visual Feedback', () => {
    it('should highlight selected stage', async () => {
      const searchParams = new URLSearchParams('stage=in-progress');
      (useSearchParams as jest.Mock).mockReturnValue(searchParams);

      render(<GarmentsPage />);

      await waitFor(() => {
        const inProgressBox = screen.getByTestId('stage-box-in-progress');
        expect(inProgressBox).toHaveAttribute('data-selected', 'true');
      });

      const viewAllBox = screen.getByTestId('stage-box-view-all');
      expect(viewAllBox).toHaveAttribute('data-selected', 'false');
    });
  });
});
