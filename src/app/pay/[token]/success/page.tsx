import { Metadata } from 'next';
import {
  Container,
  Box,
  Card,
  CardContent,
  Typography,
  Button,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Payment Successful | Threadfolio',
  description: 'Your payment has been processed successfully',
};

export default async function PaymentSuccessPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  return (
    <Container maxWidth="sm">
      <Box sx={{ mt: 8 }}>
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 3 }} />

            <Typography variant="h4" component="h1" gutterBottom>
              Payment Successful!
            </Typography>

            <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
              Your payment has been processed successfully. You will receive a
              confirmation email shortly.
            </Typography>

            <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
              Thank you for your payment. If you have any questions, please
              contact the business directly.
            </Typography>

            <Button variant="contained" component={Link} href="/" size="large">
              Close Window
            </Button>
          </CardContent>
        </Card>

        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            You can safely close this window
          </Typography>
        </Box>
      </Box>
    </Container>
  );
}
