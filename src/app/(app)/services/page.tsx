import { Container, Box, Alert } from '@mui/material';
import ServicesClient from '@/components/services/ServicesClient';
import { fetchAllServices } from '@/lib/actions/services';
import { Service } from '@/lib/utils/serviceUtils';
import type { ServiceUnitType } from '@/lib/utils/serviceUnitTypes';

// Force dynamic rendering since this page uses authentication
export const dynamic = 'force-dynamic';

export default async function ServicesPage() {
  try {
    const fetchedServices = await fetchAllServices();
    const services: Service[] = (fetchedServices as any[]).map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description ?? undefined,
      default_qty: s.default_qty ?? 1,
      default_unit: (s.default_unit as ServiceUnitType) ?? 'flat_rate',
      default_unit_price_cents: s.default_unit_price_cents ?? 0,
      frequently_used: !!s.frequently_used,
      frequently_used_position: s.frequently_used_position ?? null,
    }));

    return <ServicesClient initialServices={services} />;
  } catch (error) {
    console.error('Error loading services:', error);
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">
            {error instanceof Error ? error.message : 'Failed to load services'}
          </Alert>
        </Box>
      </Container>
    );
  }
}
