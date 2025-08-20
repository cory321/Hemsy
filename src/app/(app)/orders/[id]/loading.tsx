import {
  Container,
  Box,
  Card,
  CardContent,
  Skeleton,
  Divider,
  List,
  ListItem,
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
          }}
        >
          <Box>
            <Skeleton variant="text" width={200} height={40} />
            <Skeleton variant="text" width={150} height={24} />
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Skeleton
              variant="rectangular"
              width={100}
              height={36}
              sx={{ borderRadius: 1 }}
            />
            <Skeleton
              variant="rectangular"
              width={120}
              height={36}
              sx={{ borderRadius: 1 }}
            />
          </Box>
        </Box>

        {/* Order Info Grid */}
        <Grid container spacing={3}>
          {/* Left Column - Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Client Info Card */}
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={180}
                  height={28}
                  sx={{ mb: 2 }}
                />
                <Skeleton variant="text" width={200} height={24} />
                <Skeleton
                  variant="text"
                  width={150}
                  height={20}
                  sx={{ mt: 1 }}
                />
                <Skeleton
                  variant="text"
                  width={220}
                  height={20}
                  sx={{ mt: 0.5 }}
                />
                <Box sx={{ mt: 2 }}>
                  <Skeleton variant="text" width="80%" height={20} />
                  <Skeleton variant="text" width="70%" height={20} />
                </Box>
              </CardContent>
            </Card>

            {/* Garments Card */}
            <Card>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={150}
                  height={28}
                  sx={{ mb: 2 }}
                />
                <List>
                  {Array.from({ length: 3 }).map((_, index) => (
                    <Box key={index}>
                      <ListItem sx={{ px: 0 }}>
                        <Box
                          sx={{
                            display: 'grid',
                            gridTemplateColumns: '64px 1fr',
                            columnGap: 2,
                            alignItems: 'stretch',
                            width: '100%',
                          }}
                        >
                          {/* Garment Icon */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Skeleton
                              variant="rectangular"
                              width={48}
                              height={48}
                            />
                          </Box>

                          {/* Garment Details */}
                          <Box
                            sx={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                              }}
                            >
                              <Skeleton
                                variant="text"
                                width={180}
                                height={24}
                              />
                              <Box
                                sx={{
                                  display: 'flex',
                                  gap: 1,
                                  alignItems: 'center',
                                }}
                              >
                                <Skeleton
                                  variant="rectangular"
                                  width={60}
                                  height={24}
                                  sx={{ borderRadius: 12 }}
                                />
                                <Skeleton
                                  variant="text"
                                  width={60}
                                  height={24}
                                />
                              </Box>
                            </Box>
                            <Skeleton variant="text" width="70%" height={20} />
                            <Skeleton variant="text" width="50%" height={20} />
                          </Box>
                        </Box>
                      </ListItem>
                      {index < 2 && <Divider />}
                    </Box>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Right Column - Summary */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Order Summary Card */}
            <Card>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={150}
                  height={28}
                  sx={{ mb: 2 }}
                />

                {/* Status and Due Date */}
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width={60} />
                    <Skeleton
                      variant="rectangular"
                      width={80}
                      height={24}
                      sx={{ borderRadius: 12 }}
                    />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width={80} />
                    <Skeleton variant="text" width={100} />
                  </Box>
                </Box>

                {/* Price Breakdown */}
                <Box sx={{ mb: 2 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width={70} />
                    <Skeleton variant="text" width={80} />
                  </Box>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      mb: 1,
                    }}
                  >
                    <Skeleton variant="text" width={70} />
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
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Total */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    mb: 2,
                  }}
                >
                  <Skeleton variant="text" width={60} height={28} />
                  <Skeleton variant="text" width={100} height={28} />
                </Box>

                {/* Payment Status */}
                <Skeleton
                  variant="rectangular"
                  width="100%"
                  height={40}
                  sx={{ borderRadius: 1 }}
                />
              </CardContent>
            </Card>

            {/* Order Notes Card (optional) */}
            <Card sx={{ mt: 3 }}>
              <CardContent>
                <Skeleton
                  variant="text"
                  width={120}
                  height={28}
                  sx={{ mb: 2 }}
                />
                <Skeleton variant="text" width="100%" />
                <Skeleton variant="text" width="90%" />
                <Skeleton variant="text" width="80%" />
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
