import React from 'react';
import { render, screen } from '@testing-library/react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useUser } from '@clerk/nextjs';
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

const mockUseUser = useUser as jest.MockedFunction<typeof useUser>;

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

			render(<DashboardHeader />);

			expect(screen.getByText('Good evening, Lisa')).toBeInTheDocument();

			jest.useRealTimers();
		});

		it('should use "there" when user has no first name', () => {
			mockUseUser.mockReturnValue({
				user: { firstName: null },
				isLoaded: true,
			} as any);

			render(<DashboardHeader />);

			expect(screen.getByText(/Good \w+, there/)).toBeInTheDocument();
		});

		it('should show skeleton when user is not loaded', () => {
			mockUseUser.mockReturnValue({
				user: null,
				isLoaded: false,
			} as any);

			const { container } = render(<DashboardHeader />);

			expect(container.querySelector('.MuiSkeleton-root')).toBeInTheDocument();
		});
	});

	describe('Activity Summary', () => {
		it('should not show appointment notifications', () => {
			mockUseUser.mockReturnValue({
				user: { firstName: 'John' },
				isLoaded: true,
			} as any);

			render(<DashboardHeader />);

			// The component no longer shows appointment notifications
			expect(screen.queryByText(/appointments today/i)).not.toBeInTheDocument();
			expect(screen.queryByText(/You have/)).not.toBeInTheDocument();
		});

		it('should not show activity summary for any data', () => {
			mockUseUser.mockReturnValue({
				user: { firstName: 'John' },
				isLoaded: true,
			} as any);

			render(<DashboardHeader />);

			// Should not find any activity summary text
			expect(screen.queryByText(/appointments today/i)).not.toBeInTheDocument();
			expect(screen.queryByText(/You have/)).not.toBeInTheDocument();
		});
	});
});
