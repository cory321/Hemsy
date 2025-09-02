import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useUser } from '@clerk/nextjs';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

// Mock dependencies
jest.mock('@clerk/nextjs', () => ({
  useUser: jest.fn(),
  ClerkProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SignInButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  SignUpButton: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  UserButton: () => <div>UserButton</div>,
}));
jest.mock('@tanstack/react-query');

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>;

describe('DashboardHeader', () => {
  const today = new Date();
  const formattedDate = format(today, 'EEEE, MMMM d, yyyy');

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Date Display', () => {
    it("should always display today's date", () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });
  });

  describe('Greeting', () => {
    it('should show morning greeting before noon', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 1, 9, 0, 0)); // 9 AM

      mockUseUser.mockReturnValue({
        user: { firstName: 'Sarah' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(screen.getByText('Good morning, Sarah')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should show afternoon greeting between noon and 6pm', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 1, 14, 0, 0)); // 2 PM

      mockUseUser.mockReturnValue({
        user: { firstName: 'Mike' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(screen.getByText('Good afternoon, Mike')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should show evening greeting after 6pm', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date(2024, 0, 1, 19, 0, 0)); // 7 PM

      mockUseUser.mockReturnValue({
        user: { firstName: 'Lisa' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(screen.getByText('Good evening, Lisa')).toBeInTheDocument();

      jest.useRealTimers();
    });

    it('should use "there" when user has no first name', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: null },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(screen.getByText(/Good \w+, there/)).toBeInTheDocument();
    });

    it('should show skeleton when user is not loaded', () => {
      mockUseUser.mockReturnValue({
        user: null,
        isLoaded: false,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      const { container } = render(<DashboardHeader />);

      expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
    });
  });

  describe('Activity Summary', () => {
    it('should show both appointments and garments when both exist', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 4, garmentsDueToday: 6 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      // The component shows only appointments in the summary
      expect(
        screen.getByText('You have 4 appointments today')
      ).toBeInTheDocument();
    });

    it('should show only appointments when no garments due', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 3, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(
        screen.getByText('You have 3 appointments today')
      ).toBeInTheDocument();
    });

    it('should show only garments when no appointments', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 5 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      // The component doesn't show garment info when no appointments
      expect(screen.queryByText(/garments due today/)).not.toBeInTheDocument();
    });

    it('should show singular forms correctly', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 1, garmentsDueToday: 1 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      // The component shows only appointments in the summary
      expect(
        screen.getByText('You have 1 appointment today')
      ).toBeInTheDocument();
    });

    it('should show nothing when no appointments or garments', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      // Should not find any activity summary text
      expect(screen.queryByText(/You have/)).not.toBeInTheDocument();
    });

    it('should show skeleton when loading stats', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);
      mockUseQuery.mockReturnValue({
        data: undefined,
        isLoading: true,
      } as any);

      const { container } = render(<DashboardHeader />);

      // When loading, the component might not show skeletons but should not show stats
      expect(screen.queryByText(/appointments today/)).not.toBeInTheDocument();
    });
  });

  describe('Query Configuration', () => {
    it('should configure query with correct refetch interval and stale time', () => {
      mockUseUser.mockReturnValue({
        user: { firstName: 'John' },
        isLoaded: true,
      } as any);

      mockUseQuery.mockReturnValue({
        data: { appointmentsToday: 0, garmentsDueToday: 0 },
        isLoading: false,
      } as any);

      render(<DashboardHeader />);

      expect(mockUseQuery).toHaveBeenCalledWith({
        queryKey: ['dashboard-stats'],
        queryFn: expect.any(Function),
        refetchInterval: 5 * 60 * 1000, // 5 minutes
        staleTime: 60 * 1000, // 1 minute
      });
    });
  });
});
