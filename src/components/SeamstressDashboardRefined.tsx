'use client';

import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  Grid,
  Chip,
  IconButton,
  Paper,
  LinearProgress,
  Avatar,
  Divider,
  Badge,
  Link,
  Collapse,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CheckCircleIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  PersonAdd as PersonAddIcon,
  Build as BuildIcon,
  CameraAlt as CameraIcon,
  CalendarMonth as CalendarIcon,
  Receipt as ReceiptIcon,
  ArrowForward as ArrowForwardIcon,
  Circle as CircleIcon,
  FiberManualRecord as DotIcon,
  LocationOn as LocationIcon,
  AttachMoney as MoneyIcon,
  Inventory2 as InventoryIcon,
} from '@mui/icons-material';
import { useState } from 'react';
import { format } from 'date-fns';
import { STAGE_COLORS } from '@/constants/garmentStages';

// Remix Icon component
function RemixIcon({
  name,
  size = 18,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  return (
    <i
      className={`ri ${name}`}
      style={{ fontSize: size, color: color || 'currentColor' }}
      aria-hidden
    />
  );
}

// Refined color palette
const refinedColors = {
  background: '#FFFEFC',
  surface: '#ffffff',
  primary: '#5c7f8e',
  secondary: '#734C3E',
  success: '#5A736C',
  warning: '#F3C164',
  error: '#D94F40',
  text: {
    primary: '#1a1a1a',
    secondary: '#666666',
    tertiary: '#999999',
    quaternary: '#ffffff',
  },
  stages: STAGE_COLORS,
};

export function SeamstressDashboardRefined() {
  const theme = useTheme();
  const [showAllOverdue, setShowAllOverdue] = useState(false);
  const [showAllDueToday, setShowAllDueToday] = useState(false);

  return (
    <Box sx={{ bgcolor: refinedColors.background, minHeight: '100vh', p: 3 }}>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{ fontWeight: 600, color: refinedColors.text.primary, mb: 0.5 }}
        >
          Good morning, Sarah!
        </Typography>
        <Typography
          variant="body1"
          sx={{ color: refinedColors.text.secondary }}
        >
          Tuesday, March 19 • You have 4 appointments and 6 garments due today
        </Typography>
      </Box>

      {/* Alert Section - Softer approach */}
      <Stack spacing={2} sx={{ mb: 4 }}>
        {/* Overdue Alert */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px solid ${alpha(refinedColors.error, 0.3)}`,
            bgcolor: alpha(refinedColors.error, 0.05),
            borderRadius: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <WarningIcon sx={{ color: refinedColors.error, fontSize: 20 }} />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: refinedColors.text.primary }}
                >
                  2 items overdue
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: refinedColors.text.secondary }}
                >
                  Wedding dress (Sarah J. - 3 days), Suit jacket (Michael B. - 1
                  day)
                </Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              sx={{ color: refinedColors.error, minWidth: 'auto' }}
              onClick={() => setShowAllOverdue(!showAllOverdue)}
            >
              {showAllOverdue ? 'Show less' : 'View all'}
            </Button>
          </Stack>
        </Paper>

        {/* Due Today Alert */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            border: `1px solid ${alpha(refinedColors.warning, 0.3)}`,
            bgcolor: alpha(refinedColors.warning, 0.05),
            borderRadius: 2,
          }}
        >
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
          >
            <Stack direction="row" alignItems="center" spacing={2}>
              <ScheduleIcon
                sx={{ color: refinedColors.warning, fontSize: 20 }}
              />
              <Box>
                <Typography
                  variant="body2"
                  sx={{ fontWeight: 600, color: refinedColors.text.primary }}
                >
                  3 items due today
                </Typography>
                <Typography
                  variant="caption"
                  sx={{ color: refinedColors.text.secondary }}
                >
                  Evening gown alterations, Pants hemming, Dress fitting
                  adjustments
                </Typography>
              </Box>
            </Stack>
            <Button
              size="small"
              sx={{ color: refinedColors.warning, minWidth: 'auto' }}
              onClick={() => setShowAllDueToday(!showAllDueToday)}
            >
              {showAllDueToday ? 'Show less' : 'View all'}
            </Button>
          </Stack>
        </Paper>
      </Stack>

      {/* Main Content Grid */}
      <Grid container spacing={3}>
        {/* Left Column - Today's Focus */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {/* Next Appointment Card */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Today&apos;s Focus
                </Typography>

                {/* Next Appointment */}
                <Paper
                  sx={{
                    p: 2,
                    bgcolor: alpha(refinedColors.primary, 0.05),
                    border: `1px solid ${alpha(refinedColors.primary, 0.2)}`,
                    mb: 3,
                  }}
                >
                  <Typography
                    variant="overline"
                    sx={{ color: refinedColors.text.tertiary }}
                  >
                    Next appointment
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      fontWeight: 600,
                      color: refinedColors.primary,
                      mb: 1,
                    }}
                  >
                    10:30 AM
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    Sarah Johnson
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ color: refinedColors.text.secondary, mb: 2 }}
                  >
                    Wedding dress fitting
                  </Typography>
                  <Stack direction="row" spacing={1}>
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<PhoneIcon sx={{ fontSize: 16 }} />}
                      sx={{
                        bgcolor: refinedColors.primary,
                        '&:hover': {
                          bgcolor: alpha(refinedColors.primary, 0.8),
                        },
                      }}
                    >
                      Call
                    </Button>
                    <IconButton
                      size="small"
                      sx={{ border: '1px solid #e0e0e0' }}
                    >
                      <LocationIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Stack>
                </Paper>

                {/* Today's Schedule */}
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
                  Full Schedule
                </Typography>
                <Stack spacing={2}>
                  {[
                    {
                      time: '10:30 AM',
                      client: 'Sarah Johnson',
                      type: 'fitting',
                      current: true,
                    },
                    {
                      time: '1:00 PM',
                      client: 'Michael Brown',
                      type: 'consultation',
                    },
                    { time: '3:30 PM', client: 'Lisa Chen', type: 'pickup' },
                  ].map((apt, index) => (
                    <Stack
                      key={index}
                      direction="row"
                      spacing={2}
                      alignItems="center"
                    >
                      <Box sx={{ minWidth: 65 }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontWeight: apt.current ? 600 : 400,
                            color: apt.current
                              ? refinedColors.primary
                              : refinedColors.text.secondary,
                          }}
                        >
                          {apt.time}
                        </Typography>
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="body2">{apt.client}</Typography>
                        <Typography
                          variant="caption"
                          sx={{ color: refinedColors.text.tertiary }}
                        >
                          {apt.type}
                        </Typography>
                      </Box>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* This Week Overview - Redesigned for better UX */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 3 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    This Week
                  </Typography>
                  <Button
                    size="small"
                    endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
                    sx={{ color: refinedColors.primary }}
                  >
                    Full calendar
                  </Button>
                </Stack>

                {/* Week at a Glance - Enhanced Visual Design */}
                <Box sx={{ mb: 3 }}>
                  {/* Day headers with better spacing */}
                  <Grid container spacing={0.5} sx={{ mb: 1 }}>
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(
                      (day, index) => (
                        <Grid item xs key={index}>
                          <Typography
                            variant="caption"
                            sx={{
                              display: 'block',
                              textAlign: 'center',
                              fontWeight: 600,
                              color: refinedColors.text.tertiary,
                              fontSize: '0.65rem',
                            }}
                          >
                            {day}
                          </Typography>
                        </Grid>
                      )
                    )}
                  </Grid>

                  {/* Date cells with enhanced interactivity */}
                  <Grid container spacing={0.5}>
                    {[
                      { date: 17, appointments: 0, tasks: 0 },
                      { date: 18, appointments: 2, tasks: 1 },
                      { date: 19, appointments: 4, tasks: 2, isToday: true },
                      { date: 20, appointments: 3, tasks: 2 },
                      { date: 21, appointments: 2, tasks: 1 },
                      { date: 22, appointments: 1, tasks: 2 },
                      { date: 23, appointments: 0, tasks: 0 },
                    ].map((dayData, index) => (
                      <Grid item xs key={index}>
                        <Paper
                          sx={{
                            position: 'relative',
                            aspectRatio: '1',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: dayData.isToday
                              ? alpha(refinedColors.primary, 0.1)
                              : dayData.appointments + dayData.tasks > 0
                                ? alpha(refinedColors.primary, 0.02)
                                : 'transparent',
                            border: dayData.isToday
                              ? `2px solid ${refinedColors.primary}`
                              : '1px solid #e0e0e0',
                            borderRadius: 1.5,
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            overflow: 'hidden',
                            '&:hover': {
                              transform: 'scale(1.05)',
                              boxShadow: `0 2px 8px ${alpha(refinedColors.primary, 0.15)}`,
                              borderColor: refinedColors.primary,
                            },
                          }}
                        >
                          {/* Date number */}
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: dayData.isToday ? 700 : 500,
                              fontSize: '0.875rem',
                              color: dayData.isToday
                                ? refinedColors.primary
                                : refinedColors.text.primary,
                            }}
                          >
                            {dayData.date}
                          </Typography>

                          {/* Activity indicators */}
                          {(dayData.appointments > 0 || dayData.tasks > 0) && (
                            <Stack
                              direction="row"
                              spacing={0.25}
                              sx={{
                                position: 'absolute',
                                bottom: 4,
                                left: '50%',
                                transform: 'translateX(-50%)',
                              }}
                            >
                              {dayData.appointments > 0 && (
                                <Box
                                  sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: refinedColors.primary,
                                  }}
                                />
                              )}
                              {dayData.tasks > 0 && (
                                <Box
                                  sx={{
                                    width: 4,
                                    height: 4,
                                    borderRadius: '50%',
                                    bgcolor: refinedColors.warning,
                                  }}
                                />
                              )}
                            </Stack>
                          )}

                          {/* Hover tooltip preview */}
                          {(dayData.appointments > 0 || dayData.tasks > 0) && (
                            <Box
                              sx={{
                                position: 'absolute',
                                top: -1,
                                right: -1,
                                bgcolor: refinedColors.primary,
                                color: 'white',
                                borderRadius: '0 4px 0 8px',
                                px: 0.75,
                                py: 0.25,
                                fontSize: '0.625rem',
                                fontWeight: 700,
                                opacity: 0,
                                transition: 'opacity 0.2s',
                                '.MuiPaper-root:hover &': {
                                  opacity: 1,
                                },
                              }}
                            >
                              {dayData.appointments + dayData.tasks}
                            </Box>
                          )}
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </Box>

                {/* Quick Stats with Visual Progress */}
                <Stack spacing={2}>
                  {/* Appointments Progress */}
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <CalendarIcon
                          sx={{ fontSize: 16, color: refinedColors.primary }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Appointments
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: refinedColors.primary }}
                      >
                        12
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative' }}>
                      <LinearProgress
                        variant="determinate"
                        value={75}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(refinedColors.primary, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: refinedColors.primary,
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: 6,
                          fontSize: '0.625rem',
                          color: refinedColors.text.tertiary,
                        }}
                      >
                        75% booked
                      </Typography>
                    </Box>
                  </Box>

                  {/* Tasks/Due Dates Progress */}
                  <Box>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      sx={{ mb: 0.5 }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <InventoryIcon
                          sx={{ fontSize: 16, color: refinedColors.warning }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 500 }}>
                          Due dates
                        </Typography>
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ fontWeight: 700, color: refinedColors.warning }}
                      >
                        8
                      </Typography>
                    </Stack>
                    <Box sx={{ position: 'relative' }}>
                      <LinearProgress
                        variant="determinate"
                        value={60}
                        sx={{
                          height: 4,
                          borderRadius: 2,
                          bgcolor: alpha(refinedColors.warning, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: refinedColors.warning,
                            borderRadius: 2,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{
                          position: 'absolute',
                          right: 0,
                          top: 6,
                          fontSize: '0.625rem',
                          color: refinedColors.text.tertiary,
                        }}
                      >
                        3 urgent
                      </Typography>
                    </Box>
                  </Box>

                  {/* Available Capacity */}
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: alpha(refinedColors.success, 0.08),
                      borderRadius: 2,
                      border: `1px solid ${alpha(refinedColors.success, 0.2)}`,
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Typography
                        variant="body2"
                        sx={{ color: refinedColors.success, fontWeight: 500 }}
                      >
                        💡 3 time slots available
                      </Typography>
                      <Button
                        size="small"
                        sx={{
                          minWidth: 'auto',
                          color: refinedColors.success,
                          fontSize: '0.75rem',
                          px: 1,
                        }}
                      >
                        Book
                      </Button>
                    </Stack>
                  </Box>
                </Stack>

                {/* Upcoming Highlight */}
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    bgcolor: alpha(refinedColors.primary, 0.03),
                    borderRadius: 2,
                    border: `1px dashed ${alpha(refinedColors.primary, 0.3)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: refinedColors.text.tertiary,
                      display: 'block',
                      mb: 0.5,
                    }}
                  >
                    Next milestone
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{ fontWeight: 600, color: refinedColors.text.primary }}
                  >
                    Wedding season prep - 5 gowns
                  </Typography>
                  <Typography
                    variant="caption"
                    sx={{ color: refinedColors.primary }}
                  >
                    Starts Thursday
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Ready for Pickup */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Stack
                  direction="row"
                  justifyContent="space-between"
                  alignItems="center"
                  sx={{ mb: 2 }}
                >
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Ready for Pickup
                  </Typography>
                  <Badge badgeContent={2} color="error">
                    <InventoryIcon
                      sx={{ fontSize: 20, color: refinedColors.text.tertiary }}
                    />
                  </Badge>
                </Stack>
                <Stack spacing={2}>
                  {[
                    { name: 'Dress alterations', client: 'Lisa Chen', days: 2 },
                    { name: 'Jacket repair', client: 'Tom Wilson', days: 0 },
                  ].map((item, index) => (
                    <Box key={index}>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.name}
                      </Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: refinedColors.text.secondary }}
                      >
                        {item.client} •{' '}
                        {item.days === 0 ? 'Ready today' : `${item.days} days`}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
                <Button fullWidth variant="text" size="small" sx={{ mt: 2 }}>
                  Send pickup reminders
                </Button>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Center Column - Garment Pipeline */}
        <Grid item xs={12} lg={6}>
          <Card
            elevation={0}
            sx={{ border: '1px solid #e0e0e0', height: '100%' }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 4, fontWeight: 600 }}>
                Garment Pipeline
              </Typography>

              {/* Visual Pipeline Overview */}
              <Grid container spacing={2} sx={{ mb: 4 }}>
                {[
                  { stage: 'New', count: 5, color: refinedColors.stages.New },
                  {
                    stage: 'In Progress',
                    count: 12,
                    color: refinedColors.stages['In Progress'],
                  },
                  {
                    stage: 'Ready',
                    count: 8,
                    color: refinedColors.stages['Ready For Pickup'],
                  },
                  {
                    stage: 'Done',
                    count: 3,
                    color: refinedColors.stages.Done,
                    subtitle: 'today',
                  },
                ].map((item, index) => (
                  <Grid item xs={3} key={item.stage}>
                    <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        bgcolor: alpha(item.color, 0.08),
                        border: `2px solid ${alpha(item.color, 0.3)}`,
                        borderRadius: 2,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          transform: 'translateY(-2px)',
                          boxShadow: `0 4px 12px ${alpha(item.color, 0.2)}`,
                          borderColor: item.color,
                        },
                      }}
                    >
                      <Typography
                        variant="h4"
                        sx={{ color: item.color, fontWeight: 700, mb: 0.5 }}
                      >
                        {item.count}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 500 }}>
                        {item.stage}
                      </Typography>
                      {item.subtitle && (
                        <Typography
                          variant="caption"
                          sx={{ color: refinedColors.text.tertiary }}
                        >
                          {item.subtitle}
                        </Typography>
                      )}
                    </Paper>
                    {index < 3 && (
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mt: 1,
                        }}
                      >
                        <ArrowForwardIcon
                          sx={{
                            color: refinedColors.text.tertiary,
                            fontSize: 20,
                          }}
                        />
                      </Box>
                    )}
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 3 }} />

              {/* Active Garments */}
              <Typography variant="subtitle1" sx={{ mb: 3, fontWeight: 600 }}>
                Active Garments
              </Typography>

              <Stack spacing={2}>
                {/* Priority Item */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 3,
                    border: `2px solid ${alpha(refinedColors.warning, 0.3)}`,
                    bgcolor: alpha(refinedColors.warning, 0.02),
                    borderRadius: 2,
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="start"
                  >
                    <Box sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        alignItems="center"
                        spacing={2}
                        sx={{ mb: 1 }}
                      >
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          Evening gown alterations
                        </Typography>
                        <Chip
                          label="Due Today"
                          size="small"
                          sx={{
                            bgcolor: refinedColors.warning,
                            color: 'white',
                            fontWeight: 600,
                            height: 24,
                          }}
                        />
                      </Stack>
                      <Typography
                        variant="body2"
                        sx={{ color: refinedColors.text.secondary, mb: 2 }}
                      >
                        Mary K. • Wedding guest
                      </Typography>

                      {/* Progress Bar */}
                      <Box sx={{ mb: 2 }}>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          sx={{ mb: 1 }}
                        >
                          <Typography
                            variant="caption"
                            sx={{ color: refinedColors.text.secondary }}
                          >
                            Progress
                          </Typography>
                          <Typography
                            variant="caption"
                            sx={{ fontWeight: 600 }}
                          >
                            60%
                          </Typography>
                        </Stack>
                        <LinearProgress
                          variant="determinate"
                          value={60}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            bgcolor: alpha(refinedColors.warning, 0.2),
                            '& .MuiLinearProgress-bar': {
                              bgcolor: refinedColors.warning,
                              borderRadius: 3,
                            },
                          }}
                        />
                      </Box>

                      {/* Service Checklist */}
                      <Stack direction="row" spacing={1}>
                        <Chip
                          icon={<CheckCircleIcon sx={{ fontSize: 16 }} />}
                          label="Hem"
                          size="small"
                          sx={{
                            bgcolor: alpha(refinedColors.success, 0.1),
                            color: refinedColors.success,
                          }}
                        />
                        <Chip
                          icon={<CircleIcon sx={{ fontSize: 16 }} />}
                          label="Take in waist"
                          size="small"
                          variant="outlined"
                        />
                      </Stack>
                    </Box>

                    <Stack spacing={1}>
                      <Button variant="contained" size="small">
                        Update Status
                      </Button>
                      <Button variant="text" size="small">
                        View Details
                      </Button>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Regular Items */}
                {[
                  {
                    name: 'Pants hemming',
                    client: 'Bob R.',
                    due: 'Tomorrow',
                    stage: 'In Progress',
                    progress: 30,
                  },
                  {
                    name: 'Wedding dress',
                    client: 'Sarah J.',
                    due: 'Friday',
                    stage: 'New',
                    progress: 0,
                  },
                ].map((item, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2.5,
                      border: '1px solid #e0e0e0',
                      borderRadius: 2,
                      transition: 'all 0.2s',
                      '&:hover': {
                        borderColor: '#ccc',
                        bgcolor: alpha(refinedColors.primary, 0.02),
                      },
                    }}
                  >
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 500, mb: 0.5 }}
                        >
                          {item.name}
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{ color: refinedColors.text.secondary }}
                        >
                          {item.client} • Due {item.due}
                        </Typography>
                      </Box>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ minWidth: 100 }}>
                          <LinearProgress
                            variant="determinate"
                            value={item.progress}
                            sx={{
                              height: 4,
                              borderRadius: 2,
                              bgcolor: '#e0e0e0',
                            }}
                          />
                        </Box>
                        <Chip
                          label={item.stage}
                          size="small"
                          sx={{
                            bgcolor: alpha(
                              refinedColors.stages[
                                item.stage as keyof typeof refinedColors.stages
                              ],
                              0.2
                            ),
                            color:
                              refinedColors.stages[
                                item.stage as keyof typeof refinedColors.stages
                              ],
                            fontWeight: 600,
                          }}
                        />
                      </Stack>
                    </Stack>
                  </Paper>
                ))}
              </Stack>

              <Button
                fullWidth
                variant="text"
                sx={{ mt: 3 }}
                endIcon={<ArrowForwardIcon />}
              >
                View all garments
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column - Business Overview */}
        <Grid item xs={12} lg={3}>
          <Stack spacing={3}>
            {/* Revenue Card */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Business Health
                </Typography>

                {/* This Month Revenue */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: refinedColors.text.tertiary }}
                  >
                    This month
                  </Typography>
                  <Stack direction="row" alignItems="baseline" spacing={1}>
                    <Typography
                      variant="h4"
                      sx={{
                        fontWeight: 700,
                        color: refinedColors.text.primary,
                      }}
                    >
                      $3,250
                    </Typography>
                    <Chip
                      icon={<TrendingUpIcon sx={{ fontSize: 14 }} />}
                      label="+18%"
                      size="small"
                      sx={{
                        bgcolor: alpha(refinedColors.success, 0.1),
                        color: refinedColors.success,
                        fontWeight: 600,
                        height: 24,
                      }}
                    />
                  </Stack>
                  <Typography
                    variant="caption"
                    sx={{ color: refinedColors.text.secondary }}
                  >
                    vs $2,754 last month
                  </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Pending Invoices */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    variant="overline"
                    sx={{ color: refinedColors.text.tertiary }}
                  >
                    Pending invoices
                  </Typography>
                  <Typography variant="h5" sx={{ fontWeight: 600, mb: 0.5 }}>
                    $890
                  </Typography>
                  <Stack direction="row" spacing={2}>
                    <Typography
                      variant="caption"
                      sx={{ color: refinedColors.text.secondary }}
                    >
                      5 total
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{ color: refinedColors.error }}
                    >
                      2 overdue
                    </Typography>
                  </Stack>
                </Box>

                <Button
                  fullWidth
                  variant="outlined"
                  startIcon={<MoneyIcon />}
                  size="small"
                >
                  View finances
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Quick Actions
                </Typography>
                <Stack spacing={1}>
                  {[
                    {
                      id: 'new-order',
                      icon: 'ri-file-add-line',
                      text: 'New Order',
                    },
                    {
                      id: 'new-client',
                      icon: 'ri-user-add-line',
                      text: 'New Client',
                    },
                    {
                      id: 'new-appointment',
                      icon: 'ri-calendar-line',
                      text: 'New Appointment',
                    },
                    {
                      id: 'new-service',
                      icon: 'ri-service-line',
                      text: 'New Service',
                    },
                    {
                      id: 'new-invoice',
                      icon: 'ri-file-list-line',
                      text: 'New Invoice',
                    },
                  ].map((action) => (
                    <Button
                      key={action.id}
                      fullWidth
                      variant="text"
                      sx={{
                        py: 1.5,
                        px: 2,
                        justifyContent: 'flex-start',
                        textTransform: 'none',
                        borderRadius: 2,
                        color: refinedColors.text.primary,
                        '&:hover': {
                          bgcolor: alpha('#9c27b0', 0.08),
                          color: refinedColors.text.primary,
                        },
                        fontWeight: 400,
                      }}
                    >
                      <RemixIcon
                        name={action.icon}
                        size={18}
                        color={refinedColors.text.secondary}
                      />
                      <Box component="span" sx={{ ml: 2 }}>
                        {action.text}
                      </Box>
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>

            {/* Capacity Indicator */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Today&apos;s Capacity
                </Typography>

                <Box sx={{ position: 'relative', mb: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={80}
                    sx={{
                      height: 32,
                      borderRadius: 16,
                      bgcolor: alpha(refinedColors.primary, 0.1),
                      '& .MuiLinearProgress-bar': {
                        bgcolor: refinedColors.primary,
                        borderRadius: 16,
                      },
                    }}
                  />
                  <Typography
                    variant="body2"
                    sx={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontWeight: 600,
                      color: refinedColors.text.quaternary,
                    }}
                  >
                    80% Full
                  </Typography>
                </Box>

                <Typography
                  variant="caption"
                  sx={{ color: refinedColors.text.secondary }}
                >
                  You&apos;re at a good pace today
                </Typography>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Stack spacing={2}>
                  {[
                    { text: 'Payment received', detail: '$150 from Lisa C.' },
                    {
                      text: 'Appointment confirmed',
                      detail: 'Sarah J. at 10:30 AM',
                    },
                    {
                      text: 'Garment completed',
                      detail: 'Evening dress for Amy R.',
                    },
                  ].map((activity, index) => (
                    <Box key={index}>
                      <Typography variant="body2">{activity.text}</Typography>
                      <Typography
                        variant="caption"
                        sx={{ color: refinedColors.text.tertiary }}
                      >
                        {activity.detail}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  );
}
