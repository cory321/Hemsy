import {
  Container,
  Box,
  Skeleton,
  List,
  ListItem,
  Divider,
} from '@mui/material';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Skeleton variant="text" width={200} height={40} sx={{ mb: 3 }} />

        {/* Main Menu Items */}
        <List>
          {Array.from({ length: 3 }).map((_, index) => (
            <ListItem
              key={index}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
              }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={120} height={24} />
                <Skeleton variant="text" width={200} height={20} />
              </Box>
              <Skeleton variant="rectangular" width={24} height={24} />
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 3 }} />

        {/* Support Items */}
        <List>
          {Array.from({ length: 2 }).map((_, index) => (
            <ListItem
              key={index}
              sx={{
                bgcolor: 'background.paper',
                mb: 1,
                borderRadius: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 2,
              }}
            >
              <Skeleton variant="circular" width={24} height={24} />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width={120} height={24} />
              </Box>
            </ListItem>
          ))}
        </List>
      </Box>
    </Container>
  );
}
