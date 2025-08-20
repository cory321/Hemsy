import {
  Box,
  Skeleton,
  Paper,
  FormControl,
  Card,
  CardContent,
  Chip,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

export default function Loading() {
  return (
    <Box sx={{ p: 3 }}>
      {/* Stage Selection Skeleton */}
      <Box
        sx={{
          display: { xs: 'none', sm: 'flex' },
          alignItems: 'center',
          mb: 3,
          gap: 2,
        }}
      >
        {/* Stage Box Skeletons */}
        {Array.from({ length: 7 }).map((_, index) => (
          <Box
            key={index}
            sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
          >
            <Paper
              sx={{
                p: 2,
                textAlign: 'center',
                borderRadius: 2,
                minWidth: '120px',
                border: '2px solid',
                borderColor: 'divider',
              }}
            >
              <Skeleton
                variant="text"
                width={40}
                height={40}
                sx={{ mx: 'auto', mb: 0.5 }}
              />
              <Skeleton
                variant="text"
                width={80}
                height={20}
                sx={{ mx: 'auto' }}
              />
            </Paper>
            {index < 6 && (
              <ArrowForwardIcon
                sx={{
                  color: 'text.disabled',
                  fontSize: 20,
                }}
              />
            )}
          </Box>
        ))}
      </Box>

      {/* Mobile Stage Dropdown Skeleton */}
      <Box sx={{ display: { xs: 'block', sm: 'none' }, mb: 3 }}>
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 1 }} />
      </Box>

      {/* Search Bar Skeleton */}
      <Box sx={{ mb: 2 }}>
        <Skeleton variant="rectangular" height={56} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Controls Skeleton */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        {/* Heading */}
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          <Skeleton variant="text" width={150} height={40} />
          <Skeleton variant="text" width={80} height={24} />
        </Box>

        {/* Sort Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Skeleton
            variant="rectangular"
            width={150}
            height={40}
            sx={{ borderRadius: 1 }}
          />
          <Skeleton variant="circular" width={32} height={32} />
        </Box>
      </Box>

      {/* Garment Cards Grid */}
      <Grid container spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}>
        {Array.from({ length: 12 }).map((_, index) => (
          <Grid size={4} key={index}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                borderTop: '4px solid',
                borderTopColor: 'divider',
              }}
            >
              {/* Image Section Skeleton */}
              <Box
                sx={{
                  position: 'relative',
                  paddingTop: '100%',
                  bgcolor: 'grey.100',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    color: 'text.disabled',
                    opacity: 1,
                  }}
                >
                  <i
                    className="ri ri-t-shirt-line"
                    style={{ fontSize: 128 }}
                    aria-hidden
                  />
                </Box>
              </Box>

              <CardContent sx={{ flexGrow: 1, p: 2 }}>
                {/* Garment Name */}
                <Skeleton
                  variant="text"
                  width="80%"
                  height={28}
                  sx={{ mb: 1 }}
                />

                {/* Client Name */}
                <Skeleton
                  variant="text"
                  width="60%"
                  height={20}
                  sx={{ mb: 1 }}
                />

                {/* Due Date Chip */}
                <Skeleton
                  variant="rectangular"
                  width={100}
                  height={24}
                  sx={{ borderRadius: 12, mb: 1 }}
                />

                {/* Price */}
                <Skeleton variant="text" width={60} height={24} />
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
