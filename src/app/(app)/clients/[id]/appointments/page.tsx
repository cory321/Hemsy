import { notFound } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@/lib/supabase/server';
import { getClient } from '@/lib/actions/clients';
import { getClientAppointmentsPage } from '@/lib/actions/appointments-refactored';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Typography,
} from '@mui/material';

interface ClientAppointmentsPaginatedPageProps {
  params: Promise<{ id: string }>;
  searchParams?: Promise<{ page?: string; pageSize?: string }>;
}

export default async function ClientAppointmentsPaginatedPage({
  params,
  searchParams,
}: ClientAppointmentsPaginatedPageProps) {
  const { id } = await params;
  const { page = '1', pageSize = '10' } = (await searchParams) || {};
  const currentPage = Math.max(1, parseInt(page as string, 10) || 1);
  const limit = Math.min(
    50,
    Math.max(5, parseInt(pageSize as string, 10) || 10)
  );
  const offset = (currentPage - 1) * limit;

  const { userId } = await auth();
  if (!userId) notFound();

  // Validate client exists
  const client = await getClient(id);
  if (!client) notFound();

  // Resolve shopId for the current user
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from('users')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();
  const { data: shopData } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_user_id', userData?.id)
    .single();
  if (!shopData?.id) notFound();

  const pageResult = await getClientAppointmentsPage(shopData.id, id, {
    timeframe: 'past',
    includeCompleted: true,
    limit,
    offset,
  });

  const totalPages = Math.max(1, Math.ceil((pageResult.total || 0) / limit));

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          mt: 4,
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 2,
        }}
      >
        <Typography variant="h5">
          Past Appointments — {client.first_name} {client.last_name}
        </Typography>
        <Button component={Link} href={`/clients/${id}`} variant="text">
          Back to Client
        </Button>
      </Box>

      <Card elevation={2}>
        <CardContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Page {currentPage} of {totalPages} • {pageResult.total} total
          </Typography>
          <Divider sx={{ mb: 2 }} />

          {pageResult.appointments.length === 0 ? (
            <Typography>No past appointments.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {pageResult.appointments.map((apt) => (
                <Card key={apt.id} variant="outlined">
                  <CardContent sx={{ py: 1.5 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      {apt.date} • {apt.start_time} - {apt.end_time}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {apt.type} • {apt.status}
                    </Typography>
                    {apt.notes && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5 }}
                      >
                        {apt.notes}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}

          <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
            <Button
              component={Link}
              href={`/clients/${id}/appointments?page=${Math.max(1, currentPage - 1)}&pageSize=${limit}`}
              disabled={currentPage <= 1}
              variant="outlined"
            >
              Previous
            </Button>

            <Button
              component={Link}
              href={`/clients/${id}/appointments?page=${Math.min(totalPages, currentPage + 1)}&pageSize=${limit}`}
              disabled={currentPage >= totalPages}
              variant="outlined"
            >
              Next
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
}
