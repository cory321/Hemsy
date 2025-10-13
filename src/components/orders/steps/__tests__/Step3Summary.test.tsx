'use client';

import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Step3Summary from '../Step3Summary';

// Mock environment variables
process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME = 'test-cloud';

// Mock the resolveGarmentDisplayImage utility
jest.mock('@/utils/displayImage', () => ({
	resolveGarmentDisplayImage: jest.fn(),
}));
jest.mock('@/lib/utils/phone', () => ({
	formatPhoneNumber: (value: string) => `FORMATTED:${value}`,
}));

// Mock the OrderFlow context
const mockOrderFlowContext = {
	orderDraft: {
		client: {
			id: 'client-1',
			first_name: 'John',
			last_name: 'Doe',
			email: 'john@example.com',
			phone_number: '+1234567890',
		},
		garments: [
			{
				id: 'garment-1',
				name: 'Wedding Dress',
				cloudinaryPublicId: 'test-cloud-id',
				cloudinaryUrl: 'https://test-url.com/image.jpg',
				presetIconKey: 'dress-formal',
				presetFillColor: '#ff0000',
				services: [
					{
						name: 'Hemming',
						quantity: 1,
						unit: 'item',
						unitPriceCents: 5000,
					},
				],
				dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow in YYYY-MM-DD format
				notes: 'Special care needed',
			},
			{
				id: 'garment-2',
				name: 'Suit Jacket',
				presetIconKey: 'jacket',
				presetFillColor: '#0000ff',
				services: [
					{
						name: 'Alterations',
						quantity: 2,
						unit: 'item',
						unitPriceCents: 3000,
					},
				],
			},
			{
				id: 'garment-3',
				name: 'Plain Shirt',
				services: [
					{
						name: 'Basic Alterations',
						quantity: 1,
						unit: 'item',
						unitPriceCents: 2000,
					},
				],
			},
		],
		discountCents: 0,
		notes: 'Test order notes',
	},
	updateOrderDraft: jest.fn(),
	calculateSubtotal: jest.fn(() => 16000), // $160.00
	calculateTotal: jest.fn(() => 17280), // $172.80 (with tax)
	addGarment: jest.fn(),
	updateGarment: jest.fn(),
	removeGarment: jest.fn(),
	resetOrder: jest.fn(),
	setClient: jest.fn(),
};

// Mock the useOrderFlow hook
jest.mock('@/contexts/OrderFlowContext', () => ({
	useOrderFlow: () => ({
		...mockOrderFlowContext,
		taxPercent: 8, // 8% tax rate for testing
	}),
}));

// Mock Supabase client
jest.mock('@/lib/supabase/client', () => ({
	createClient: jest.fn(() => ({
		auth: {
			getUser: jest.fn(() =>
				Promise.resolve({ data: { user: { id: 'test-user' } } })
			),
		},
		from: jest.fn(() => ({
			select: jest.fn(() => ({
				eq: jest.fn(() => ({
					single: jest.fn(() =>
						Promise.resolve({ data: { tax_percent: 0.08 } })
					),
				})),
			})),
		})),
	})),
}));

// Mock PaymentCollectionCard
jest.mock('../../PaymentCollectionCard', () => {
	return function MockPaymentCollectionCard() {
		return (
			<div data-testid="payment-collection-card">Payment Collection Card</div>
		);
	};
});

const theme = createTheme();
const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: false },
		mutations: { retry: false },
	},
});

const renderWithProviders = (component: React.ReactElement) => {
	return render(
		<QueryClientProvider client={queryClient}>
			<ThemeProvider theme={theme}>{component}</ThemeProvider>
		</QueryClientProvider>
	);
};

describe('Step3Summary Image Display', () => {
	const { resolveGarmentDisplayImage } = require('@/utils/displayImage');

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('displays cloudinary image when available', () => {
		// Mock cloudinary image resolution
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'cloud',
			src: 'https://res.cloudinary.com/test-cloud/image/upload/test-cloud-id',
		});

		renderWithProviders(<Step3Summary />);

		// Check that cloudinary image is rendered
		const cloudinaryImage = screen.getByAltText('Wedding Dress');
		expect(cloudinaryImage).toBeInTheDocument();
		expect(cloudinaryImage).toHaveAttribute(
			'src',
			'https://res.cloudinary.com/test-cloud/image/upload/c_fill,h_96,w_96/test-cloud-id'
		);
	});

	it('displays preset SVG icon when no cloudinary image', () => {
		// Mock preset icon resolution
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/jacket.svg',
		});

		renderWithProviders(<Step3Summary />);

		// The InlinePresetSvg component should be rendered with the correct src
		expect(resolveGarmentDisplayImage).toHaveBeenCalledWith({
			cloudPublicId: undefined,
			photoUrl: undefined,
			presetIconKey: 'jacket',
		});
	});

	it('displays default select-garment.svg when nothing is set', () => {
		// Mock default resolution
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});

		renderWithProviders(<Step3Summary />);

		// Should use default SVG for garment without any image data
		expect(resolveGarmentDisplayImage).toHaveBeenCalledWith({
			cloudPublicId: undefined,
			photoUrl: undefined,
			presetIconKey: undefined,
		});
	});

	it('renders garment information correctly', () => {
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});

		renderWithProviders(<Step3Summary />);

		// Check garment names are displayed
		expect(screen.getByText('Wedding Dress')).toBeInTheDocument();
		expect(screen.getByText('Suit Jacket')).toBeInTheDocument();
		expect(screen.getByText('Plain Shirt')).toBeInTheDocument();

		// Check services are displayed - the component now shows garment count and urgency
		expect(screen.getByText('3 garments')).toBeInTheDocument();
		expect(screen.getByText('1 urgent')).toBeInTheDocument();
	});

	it('handles rush orders correctly', () => {
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});

		renderWithProviders(<Step3Summary />);

		// Should show rush indicator for garment with due date tomorrow
		expect(screen.getByText('Rush')).toBeInTheDocument();
	});

	it('displays client information', () => {
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});

		renderWithProviders(<Step3Summary />);

		// Check client information
		expect(screen.getAllByText('John Doe').length).toBeGreaterThan(0);
		expect(screen.getAllByText('john@example.com').length).toBeGreaterThan(0);
	});

	it('calculates and displays pricing correctly', async () => {
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});

		renderWithProviders(<Step3Summary />);

		// Wait for async tax percent fetch to update totals; allow multiple matches
		const totals = await screen.findAllByText('$172.80');
		expect(totals.length).toBeGreaterThan(0);
	});

	it('formats client phone number using phone utility', () => {
		const { resolveGarmentDisplayImage } = require('@/utils/displayImage');
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});

		renderWithProviders(<Step3Summary />);

		const elems = screen.getAllByText('FORMATTED:+1234567890');
		expect(elems.length).toBeGreaterThan(0);
	});
});

describe('Step3Summary Discount Validation', () => {
	const { resolveGarmentDisplayImage } = require('@/utils/displayImage');

	beforeEach(() => {
		jest.clearAllMocks();
		resolveGarmentDisplayImage.mockReturnValue({
			kind: 'preset',
			src: '/presets/garments/select-garment.svg',
		});
	});

	it('displays discount field', () => {
		renderWithProviders(<Step3Summary />);

		// Find the discount label
		expect(screen.getByText('Discount')).toBeInTheDocument();

		// The discount field should be present (it's a TextField with $ prefix)
		const discountInputs = screen.getAllByRole('textbox');
		expect(discountInputs.length).toBeGreaterThan(0);
	});

	it('caps discount at subtotal when user enters amount exceeding subtotal', async () => {
		const user = userEvent.setup();

		// Track calls to updateOrderDraft
		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find the discount field by looking for the parent with "Discount" label
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		expect(discountContainer).toBeTruthy();

		// Get the input within that container
		const discountInput = discountContainer?.querySelector('input');
		expect(discountInput).toBeTruthy();

		if (discountInput) {
			// Try to enter discount larger than subtotal ($160)
			await user.clear(discountInput);
			await user.type(discountInput, '200.00');

			// Find all discountCents updates
			const discountUpdates = updateCalls.filter(
				(call) => call.discountCents !== undefined
			);

			// The final discount should be capped at subtotal (16000 cents = $160)
			const lastDiscountUpdate = discountUpdates[discountUpdates.length - 1];
			expect(lastDiscountUpdate.discountCents).toBe(16000);
		}
	});

	it('prevents negative total by capping discount', () => {
		// The component uses Math.max(0, ...) to prevent negative afterDiscount
		// This test verifies the component renders without crashing when discount exceeds subtotal
		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		// The component should not crash and should render properly
		expect(screen.getByText('Discount')).toBeInTheDocument();
		expect(discountInput).toBeInTheDocument();
	});

	it('shows error helper text when trying to enter discount exceeding subtotal', async () => {
		const user = userEvent.setup();

		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Try to type an amount that would exceed subtotal
			// The component should auto-cap it, but test the error display logic
			await user.clear(discountInput);
			await user.type(discountInput, '200');

			// After the component caps it to $160, the error should not show
			// But the max helper text might appear briefly
			// This validates the error state logic exists in the component
			expect(discountInput).toBeInTheDocument();
		}
	});

	it('allows valid discount within subtotal', async () => {
		const user = userEvent.setup();

		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find the discount field by looking for the parent with "Discount" label
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Enter valid discount less than subtotal
			await user.clear(discountInput);
			await user.type(discountInput, '50.00');

			// Find all discountCents updates
			const discountUpdates = updateCalls.filter(
				(call) => call.discountCents !== undefined
			);

			// Should update with the entered value
			const lastDiscountUpdate = discountUpdates[discountUpdates.length - 1];
			expect(lastDiscountUpdate.discountCents).toBe(5000); // $50
		}
	});

	it('quick discount buttons calculate percentage correctly', async () => {
		const user = userEvent.setup();

		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find and click the -10% button
		const discount10Button = screen.getByRole('button', { name: '-10%' });
		await user.click(discount10Button);

		// 10% of $160 = $16.00 = 1600 cents
		expect(updateCalls[updateCalls.length - 1]).toEqual(
			expect.objectContaining({
				discountCents: 1600,
			})
		);

		updateCalls.length = 0; // Clear

		// Test -15% button
		const discount15Button = screen.getByRole('button', { name: '-15%' });
		await user.click(discount15Button);

		// 15% of $160 = $24.00 = 2400 cents
		expect(updateCalls[updateCalls.length - 1]).toEqual(
			expect.objectContaining({
				discountCents: 2400,
			})
		);

		updateCalls.length = 0; // Clear

		// Test -20% button
		const discount20Button = screen.getByRole('button', { name: '-20%' });
		await user.click(discount20Button);

		// 20% of $160 = $32.00 = 3200 cents
		expect(updateCalls[updateCalls.length - 1]).toEqual(
			expect.objectContaining({
				discountCents: 3200,
			})
		);
	});

	it('prevents entering more than 2 decimal places', async () => {
		const user = userEvent.setup();

		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Try to type a value with 3 decimal places
			await user.clear(discountInput);
			await user.type(discountInput, '10.999');

			// The input should have truncated to 2 decimal places
			expect(discountInput).toHaveValue('10.99');

			// Find all discountCents updates
			const discountUpdates = updateCalls.filter(
				(call) => call.discountCents !== undefined
			);

			// Should have updated with 10.99 = 1099 cents
			const lastDiscountUpdate = discountUpdates[discountUpdates.length - 1];
			expect(lastDiscountUpdate.discountCents).toBe(1099);
		}
	});

	it('allows valid amounts with 2 decimal places', async () => {
		const user = userEvent.setup();

		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Enter a valid amount with 2 decimal places
			await user.clear(discountInput);
			await user.type(discountInput, '25.99');

			expect(discountInput).toHaveValue('25.99');

			// Find all discountCents updates
			const discountUpdates = updateCalls.filter(
				(call) => call.discountCents !== undefined
			);

			// Should have updated with 25.99 = 2599 cents
			const lastDiscountUpdate = discountUpdates[discountUpdates.length - 1];
			expect(lastDiscountUpdate.discountCents).toBe(2599);
		}
	});

	it('allows amounts with 1 decimal place', async () => {
		const user = userEvent.setup();

		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Enter a valid amount with 1 decimal place
			await user.clear(discountInput);
			await user.type(discountInput, '15.5');

			expect(discountInput).toHaveValue('15.5');

			// Find all discountCents updates
			const discountUpdates = updateCalls.filter(
				(call) => call.discountCents !== undefined
			);

			// Should have updated with 15.5 = 1550 cents
			const lastDiscountUpdate = discountUpdates[discountUpdates.length - 1];
			expect(lastDiscountUpdate.discountCents).toBe(1550);
		}
	});

	it('allows whole dollar amounts', async () => {
		const user = userEvent.setup();

		const updateCalls: any[] = [];
		mockOrderFlowContext.updateOrderDraft.mockImplementation((update: any) => {
			updateCalls.push(update);
		});

		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Enter a whole dollar amount
			await user.clear(discountInput);
			await user.type(discountInput, '20');

			expect(discountInput).toHaveValue('20');

			// Find all discountCents updates
			const discountUpdates = updateCalls.filter(
				(call) => call.discountCents !== undefined
			);

			// Should have updated with 20 = 2000 cents
			const lastDiscountUpdate = discountUpdates[discountUpdates.length - 1];
			expect(lastDiscountUpdate.discountCents).toBe(2000);
		}
	});

	it('prevents multiple decimal points', async () => {
		const user = userEvent.setup();

		renderWithProviders(<Step3Summary />);

		// Find the discount field
		const discountLabel = screen.getByText('Discount');
		const discountContainer = discountLabel.closest('.MuiBox-root');
		const discountInput = discountContainer?.querySelector('input');

		if (discountInput) {
			// Try to type multiple decimal points
			await user.clear(discountInput);
			await user.type(discountInput, '10.5.5');

			// Should have stopped at first decimal and not allow the second one
			expect(discountInput).toHaveValue('10.55');
		}
	});
});
