import { Container, Box } from '@mui/material';
import { SkeletonHeader, SkeletonTable } from '@/components/ui/Skeleton';

export default function Loading() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <SkeletonHeader />
        <SkeletonTable rows={7} columns={5} />
      </Box>
    </Container>
  );
}
