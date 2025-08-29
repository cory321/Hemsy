import {
  Stack,
  Card,
  CardContent,
  Typography,
  Skeleton,
  Box,
} from '@mui/material';

export function AppointmentsFocusLoading() {
  return (
    <Stack spacing={3}>
      {/* Next Appointment Card Loading */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
            Appointments
          </Typography>

          {/* Next Appointment Skeleton */}
          <Box
            sx={{
              p: 2,
              bgcolor: 'rgba(92, 127, 142, 0.05)',
              border: '1px solid rgba(92, 127, 142, 0.2)',
              borderRadius: 1,
              mb: 3,
            }}
          >
            <Skeleton variant="text" width={120} height={16} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={100} height={32} sx={{ mb: 1 }} />
            <Skeleton variant="text" width={150} height={20} sx={{ mb: 0.5 }} />
            <Skeleton variant="text" width={100} height={16} sx={{ mb: 2 }} />

            {/* Action buttons skeleton */}
            <Stack direction="row" spacing={1}>
              <Skeleton variant="rectangular" width={100} height={32} />
              <Skeleton variant="rectangular" width={90} height={32} />
            </Stack>
          </Box>

          {/* Today's Schedule Skeleton */}
          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
            Today&apos;s Schedule
          </Typography>
          <Stack spacing={2}>
            {/* Schedule item skeletons */}
            {[1, 2, 3].map((item) => (
              <Stack key={item} direction="row" spacing={2} alignItems="center">
                <Box sx={{ minWidth: 65 }}>
                  <Skeleton variant="text" width={60} height={20} />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={120} height={20} />
                  <Skeleton variant="text" width={80} height={16} />
                </Box>
              </Stack>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Week Overview Loading */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
          <Stack direction="row" spacing={1} justifyContent="space-between">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => (
              <Box key={day} sx={{ textAlign: 'center', flex: 1 }}>
                <Skeleton
                  variant="text"
                  width={20}
                  height={16}
                  sx={{ mb: 1, mx: 'auto' }}
                />
                <Skeleton
                  variant="circular"
                  width={32}
                  height={32}
                  sx={{ mx: 'auto', mb: 1 }}
                />
                <Skeleton
                  variant="text"
                  width={16}
                  height={12}
                  sx={{ mx: 'auto' }}
                />
              </Box>
            ))}
          </Stack>
          <Skeleton
            variant="rectangular"
            width={120}
            height={32}
            sx={{ mt: 2, mx: 'auto' }}
          />
        </CardContent>
      </Card>

      {/* Ready for Pickup Loading */}
      <Card elevation={0} sx={{ border: '1px solid #e0e0e0' }}>
        <CardContent>
          <Skeleton variant="text" width={150} height={24} sx={{ mb: 2 }} />
          <Stack spacing={1}>
            {[1, 2].map((item) => (
              <Stack key={item} direction="row" spacing={2} alignItems="center">
                <Skeleton variant="rectangular" width={40} height={40} />
                <Box sx={{ flex: 1 }}>
                  <Skeleton variant="text" width={140} height={20} />
                  <Skeleton variant="text" width={100} height={16} />
                </Box>
                <Skeleton variant="rectangular" width={60} height={24} />
              </Stack>
            ))}
          </Stack>
          <Skeleton
            variant="rectangular"
            width={140}
            height={32}
            sx={{ mt: 2 }}
          />
        </CardContent>
      </Card>
    </Stack>
  );
}
