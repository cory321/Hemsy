'use client';

import {
	Card,
	CardContent,
	Typography,
	Skeleton,
	Tooltip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { formatCurrency } from '@/lib/utils/formatting';
import type { OrderStats } from '@/lib/actions/orders';

interface OrderStatsCardsProps {
	stats: OrderStats | null;
	loading?: boolean;
	excludeMonthlyRevenue?: boolean;
	verticalLayout?: boolean;
	onCardClick?: (
		filter: 'unpaid' | 'due_this_week' | 'in_progress' | null
	) => void;
}

export default function OrderStatsCards({
	stats,
	loading = false,
	excludeMonthlyRevenue = false,
	verticalLayout = false,
	onCardClick,
}: OrderStatsCardsProps) {
	const getTrendIcon = (comparison: number) => {
		if (comparison > 0) {
			return <TrendingUpIcon sx={{ fontSize: 20, color: 'success.main' }} />;
		} else if (comparison < 0) {
			return <TrendingDownIcon sx={{ fontSize: 20, color: 'error.main' }} />;
		}
		return <TrendingFlatIcon sx={{ fontSize: 20, color: 'text.secondary' }} />;
	};

	const getTrendColor = (comparison: number) => {
		if (comparison > 0) return 'success.main';
		if (comparison < 0) return 'error.main';
		return 'text.secondary';
	};

	const formatComparison = (comparison: number) => {
		const sign = comparison >= 0 ? '+' : '';
		return `${sign}${Math.round(comparison)}%`;
	};

	const allCards = [
		{
			title: 'Unpaid Balance',
			value: stats ? formatCurrency(stats.unpaidAmountCents) : '$0.00',
			subtitle: stats ? `${stats.unpaidCount} orders` : '0 orders',
			color: 'warning.main',
			clickFilter: 'unpaid' as const,
		},
		{
			title: 'Due This Week',
			value: stats ? `${stats.dueThisWeekCount} orders` : '0 orders',
			subtitle: stats ? formatCurrency(stats.dueThisWeekAmountCents) : '$0.00',
			color:
				stats && stats.dueThisWeekCount > 0 ? 'error.main' : 'text.secondary',
			clickFilter: 'due_this_week' as const,
		},
		{
			title: 'This Month',
			value: stats ? formatCurrency(stats.monthlyRevenueCents) : '$0.00',
			subtitle: 'Collected',
			color: 'success.main',
			showTrend: true,
			trend: stats?.monthlyRevenueComparison || 0,
			clickFilter: null,
		},
		{
			title: 'In Progress',
			value: stats ? `${stats.inProgressCount} orders` : '0 orders',
			subtitle: stats ? formatCurrency(stats.inProgressAmountCents) : '$0.00',
			color: 'info.main',
			clickFilter: 'in_progress' as const,
		},
	];

	// Filter out monthly revenue card if requested
	const cards = excludeMonthlyRevenue
		? allCards.filter((card) => card.title !== 'This Month')
		: allCards;

	// Adjust grid sizing based on layout and number of cards
	const getGridSize = () => {
		if (verticalLayout) {
			return { xs: 12 }; // Full width when in vertical layout (sidebar)
		}
		return excludeMonthlyRevenue
			? { xs: 12, sm: 6, md: 4 } // 3 cards: full width on xs, 2 per row on sm, 3 per row on md+
			: { xs: 6, md: 3 }; // 4 cards: original layout
	};

	const gridSize = getGridSize();

	return (
		<Grid container spacing={2} sx={{ mb: 3 }}>
			{cards.map((card, index) => (
				<Grid key={index} size={gridSize}>
					<Card
						sx={{
							cursor: card.clickFilter && onCardClick ? 'pointer' : 'default',
							transition: 'all 0.2s ease-in-out',
							'&:hover':
								card.clickFilter && onCardClick
									? {
											transform: 'translateY(-2px)',
											boxShadow: 3,
										}
									: {},
						}}
						onClick={() => {
							if (card.clickFilter && onCardClick) {
								onCardClick(card.clickFilter);
							}
						}}
					>
						<CardContent>
							<Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
								{card.title}
							</Typography>
							{loading ? (
								<>
									<Skeleton variant="text" width={100} height={32} />
									<Skeleton variant="text" width={80} height={20} />
								</>
							) : (
								<>
									<Typography
										variant="h5"
										component="div"
										color={card.color}
										sx={{ fontWeight: 600 }}
									>
										{card.value}
									</Typography>
									<Typography
										variant="caption"
										color="text.secondary"
										sx={{
											display: 'flex',
											alignItems: 'center',
											gap: 0.5,
										}}
									>
										{card.showTrend && stats ? (
											<Tooltip
												title={
													stats.monthlyRevenueComparison > 0
														? 'Compared to last month'
														: stats.monthlyRevenueComparison < 0
															? 'Compared to last month'
															: 'Same as last month'
												}
											>
												<span
													style={{
														display: 'flex',
														alignItems: 'center',
														gap: '4px',
													}}
												>
													{getTrendIcon(card.trend)}
													<span style={{ color: getTrendColor(card.trend) }}>
														{formatComparison(card.trend)}
													</span>
												</span>
											</Tooltip>
										) : (
											card.subtitle
										)}
									</Typography>
								</>
							)}
						</CardContent>
					</Card>
				</Grid>
			))}
		</Grid>
	);
}
