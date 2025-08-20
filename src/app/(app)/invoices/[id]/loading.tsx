import {
  Container,
  Box,
  Card,
  CardContent,
  Skeleton,
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid2';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
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
          <Box>
            <Skeleton variant="text" width={150} height={40} />
            <Skeleton
              variant="rectangular"
              width={100}
              height={24}
              sx={{ mt: 1, borderRadius: 12 }}
            />
          </Box>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Skeleton
              variant="rectangular"
              width={100}
              height={36}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width={140}
              height={36}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width={160}
              height={36}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>

        <Grid container spacing={3}>
          {/* Left Column - Invoice Details */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card>
              <CardContent>
                {/* Business Info */}
                <Box sx={{ mb: 4 }}>
                  <Skeleton variant="text" width={200} height={32} />
                  <Skeleton
                    variant="text"
                    width={250}
                    height={20}
                    sx={{ mt: 1 }}
                  />
                  <Skeleton
                    variant="text"
                    width={180}
                    height={20}
                    sx={{ mt: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width={220}
                    height={20}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                {/* Bill To */}
                <Box sx={{ mb: 4 }}>
                  <Skeleton
                    variant="text"
                    width={80}
                    height={24}
                    sx={{ mb: 1 }}
                  />
                  <Skeleton variant="text" width={200} height={24} />
                  <Skeleton
                    variant="text"
                    width={180}
                    height={20}
                    sx={{ mt: 0.5 }}
                  />
                  <Skeleton
                    variant="text"
                    width={220}
                    height={20}
                    sx={{ mt: 0.5 }}
                  />
                </Box>

                {/* Invoice Details Grid */}
                <Grid container spacing={2} sx={{ mb: 4 }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Skeleton variant="text" width={100} height={20} />
                    <Skeleton variant="text" width={120} height={24} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton variant="text" width={100} height={24} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Skeleton variant="text" width={80} height={20} />
                    <Skeleton variant="text" width={100} height={24} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Skeleton variant="text" width={100} height={20} />
                    <Skeleton variant="text" width={120} height={24} />
                  </Grid>
                </Grid>

                {/* Line Items */}
                <Box>
                  <Skeleton
                    variant="text"
                    width={100}
                    height={24}
                    sx={{ mb: 2 }}
                  />

                  {/* Table Header */}
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 2,
                      pb: 1,
                      borderBottom: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Skeleton variant="text" width={200} />
                    <Box sx={{ display: 'flex', gap: 4 }}>
                      <Skeleton variant="text" width={60} />
                      <Skeleton variant="text" width={80} />
                      <Skeleton variant="text" width={80} />
                    </Box>
                  </Box>

                  {/* Line Items */}
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Box
                      key={index}
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 2,
                      }}
                    >
                      <Skeleton variant="text" width="40%" />
                      <Box sx={{ display: 'flex', gap: 4 }}>
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={80} />
                        <Skeleton variant="text" width={80} />
                      </Box>
                    </Box>
                  ))}

                  {/* Summary */}
                  <Divider sx={{ my: 3 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ width: 300 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Skeleton variant="text" width={80} />
                        <Skeleton variant="text" width={80} />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Skeleton variant="text" width={60} />
                        <Skeleton variant="text" width={80} />
                      </Box>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          mb: 1,
                        }}
                      >
                        <Skeleton variant="text" width={40} />
                        <Skeleton variant="text" width={80} />
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}
                      >
                        <Skeleton variant="text" width={60} height={28} />
                        <Skeleton variant="text" width={100} height={28} />
                      </Box>
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Payment Info */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Amount Due Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={120}
                  height={24}
                  sx={{ mb: 2 }}
                />
                <Skeleton variant="text" width={150} height={40} />
                <Box sx={{ mt: 3 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width={100} />
                    <Skeleton variant="text" width={80} />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="text" width={80} />
                  </Box>
                  <Box
                    sx={{ display: 'flex', justifyContent: 'space-between' }}
                  >
                    <Skeleton variant="text" width={120} />
                    <Skeleton variant="text" width={80} />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Payments Card */}
            <Card>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={100}
                  height={24}
                  sx={{ mb: 2 }}
                />
                {Array.from({ length: 2 }).map((_, index) => (
                  <Box
                    key={index}
                    sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
                  >
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        mb: 1,
                      }}
                    >
                      <Skeleton variant="text" width={100} />
                      <Skeleton variant="text" width={80} />
                    </Box>
                    <Skeleton variant="text" width={120} height={16} />
                    <Skeleton variant="text" width={150} height={16} />
                  </Box>
                ))}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
