'use client';

import {
  Card,
  CardContent,
  Typography,
  Box,
  Stack,
  Chip,
  Divider,
  Button,
  alpha,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  AttachMoney as MoneyIcon,
} from '@mui/icons-material';
import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils/formatting';

interface BusinessHealthProps {
  currentMonthRevenueCents?: number;
  lastMonthRevenueCents?: number;
  monthlyRevenueComparison?: number;
  unpaidBalanceCents?: number;
  unpaidOrdersCount?: number;
  currentPeriodLabel?: string;
  comparisonPeriodLabel?: string;
  rolling30DayLabel?: string;
  previous30DayLabel?: string;

  // Enhanced fields
  dailyAverageThisMonth?: number;
  periodContext?: 'early' | 'mid' | 'late';
  transactionCount?: number;
  rolling30DayRevenue?: number;
  previous30DayRevenue?: number;
  rolling30DayComparison?: number;

  onViewFinances?: () => void;
  loading?: boolean;
  hideUnpaidBalance?: boolean;
}

const refinedColors = {
  success: '#5A736C',
  error: '#D94F40',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
  },
};

export function BusinessHealth({
  currentMonthRevenueCents = 0,
  lastMonthRevenueCents = 0,
  monthlyRevenueComparison = 0,
  unpaidBalanceCents = 0,
  unpaidOrdersCount = 0,
  currentPeriodLabel,
  comparisonPeriodLabel,
  rolling30DayLabel,
  previous30DayLabel,

  // Enhanced fields
  dailyAverageThisMonth = 0,
  periodContext = 'early',
  transactionCount = 0,
  rolling30DayRevenue = 0,
  previous30DayRevenue = 0,
  rolling30DayComparison = 0,

  onViewFinances,
  loading = false,
  hideUnpaidBalance = false,
}: BusinessHealthProps) {
  // Toggle state with localStorage persistence
  const [viewMode, setViewMode] = useState<'mtd' | 'rolling30'>('mtd');

  // Load saved preference on mount
  useEffect(() => {
    const saved = localStorage.getItem('businessHealthView') as
      | 'mtd'
      | 'rolling30';
    if (saved && ['mtd', 'rolling30'].includes(saved)) {
      setViewMode(saved);
    }
  }, []);

  // Save preference when changed
  const handleViewModeChange = (newMode: 'mtd' | 'rolling30') => {
    setViewMode(newMode);
    localStorage.setItem('businessHealthView', newMode);
  };

  // Get current display values based on view mode
  const currentRevenueCents =
    viewMode === 'mtd' ? currentMonthRevenueCents : rolling30DayRevenue;
  const previousRevenueCents =
    viewMode === 'mtd' ? lastMonthRevenueCents : previous30DayRevenue;
  const comparison =
    viewMode === 'mtd' ? monthlyRevenueComparison : rolling30DayComparison;
  const periodLabel =
    viewMode === 'mtd' ? currentPeriodLabel : rolling30DayLabel;
  const comparisonLabel =
    viewMode === 'mtd' ? comparisonPeriodLabel : previous30DayLabel;

  // Smart percentage logic
  const getSmartPercentageDisplay = () => {
    if (loading) return null;

    if (previousRevenueCents === 0 && currentRevenueCents > 0) {
      return {
        text: 'New revenue this period',
        color: refinedColors.success,
        showIcon: false,
      };
    }

    if (currentRevenueCents === 0) {
      return {
        text: 'No sales yet this period',
        color: refinedColors.text.secondary,
        showIcon: false,
      };
    }

    if (comparison === 0) {
      return null; // No change indicator
    }

    return {
      text: `${comparison > 0 ? '+' : ''}${comparison}%`,
      color: comparison > 0 ? refinedColors.success : refinedColors.error,
      showIcon: true,
      isPositive: comparison > 0,
    };
  };

  const percentageDisplay = getSmartPercentageDisplay();

  // Period context display
  const getPeriodContextText = () => {
    if (loading) return '';
    if (periodContext === 'early') return ' (early in month)';
    if (periodContext === 'mid') return ' (mid-month)';
    if (periodContext === 'late') return ' (nearly complete)';
    return '';
  };

  return (
    <Card
      elevation={0}
      sx={{ border: '1px solid #e0e0e0', minHeight: 'fit-content' }}
    >
      <CardContent sx={{ '&:last-child': { pb: 2 } }}>
        {/* Header with Toggle */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            mb: 3,
            flexWrap: 'wrap',
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600, flexShrink: 0 }}>
            Business Health
          </Typography>

          {!loading && (
            <ToggleButtonGroup
              value={viewMode}
              exclusive
              onChange={(_, newMode) =>
                newMode && handleViewModeChange(newMode)
              }
              size="small"
              sx={{
                height: 28,
                flexShrink: 0,
              }}
            >
              <ToggleButton
                value="mtd"
                sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', minWidth: 40 }}
              >
                MTD
              </ToggleButton>
              <ToggleButton
                value="rolling30"
                sx={{ px: 1.5, py: 0.5, fontSize: '0.75rem', minWidth: 40 }}
              >
                30d
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Box>

        {/* Revenue Section */}
        <Box sx={{ mb: 3 }}>
          <Typography
            variant="overline"
            sx={{ color: refinedColors.text.tertiary }}
          >
            {loading
              ? 'This month'
              : `${periodLabel}${viewMode === 'mtd' ? getPeriodContextText() : ''}`}
          </Typography>

          {/* Revenue Amount */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              color: refinedColors.text.primary,
              mb: 1,
              wordBreak: 'break-word',
            }}
          >
            {loading ? '...' : formatCurrency(currentRevenueCents)}
          </Typography>

          {/* Smart Percentage Display */}
          {percentageDisplay && (
            <Box sx={{ mb: 0.5 }}>
              <Chip
                {...(percentageDisplay.showIcon && {
                  icon: percentageDisplay.isPositive ? (
                    <TrendingUpIcon sx={{ fontSize: 14 }} />
                  ) : (
                    <TrendingDownIcon sx={{ fontSize: 14 }} />
                  ),
                })}
                label={percentageDisplay.text}
                size="small"
                sx={{
                  bgcolor: alpha(percentageDisplay.color, 0.1),
                  color: percentageDisplay.color,
                  fontWeight: 600,
                  height: 24,
                }}
              />
            </Box>
          )}

          <Typography
            variant="caption"
            sx={{
              color: refinedColors.text.secondary,
              display: 'block',
              wordBreak: 'break-word',
              lineHeight: 1.3,
            }}
          >
            vs {loading ? '...' : formatCurrency(previousRevenueCents)} (
            {loading ? 'comparison period' : comparisonLabel})
          </Typography>
        </Box>

        {/* Unpaid Balance Section - conditionally rendered */}
        {!hideUnpaidBalance && (
          <>
            <Divider sx={{ my: 2 }} />

            <Box sx={{ mb: 3 }}>
              <Typography
                variant="overline"
                sx={{ color: refinedColors.text.tertiary }}
              >
                Unpaid Balance
              </Typography>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 600,
                  mb: 0.5,
                  wordBreak: 'break-word',
                  lineHeight: 1.2,
                }}
              >
                {loading ? '...' : formatCurrency(unpaidBalanceCents)}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: refinedColors.text.secondary,
                  display: 'block',
                }}
              >
                {loading ? '...' : `${unpaidOrdersCount} orders`}
              </Typography>
            </Box>

            {onViewFinances && (
              <Button
                fullWidth
                variant="outlined"
                startIcon={<MoneyIcon />}
                size="small"
                onClick={onViewFinances}
              >
                View orders
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
