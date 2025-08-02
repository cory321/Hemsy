import { Container, Typography, Box } from '@mui/material';

export default function Home() {
  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          my: 4,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <Typography variant="h1" component="h1" gutterBottom>
          Threadfolio V2
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Seamstress Business Management
        </Typography>
        <Typography variant="body1" align="center">
          Welcome to Threadfolio V2 - Your mobile-first PWA for managing your
          tailoring business.
        </Typography>
      </Box>
    </Container>
  );
}
