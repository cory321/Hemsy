'use client';

import { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert,
  Grid,
} from '@mui/material';

import ServiceList from '@/components/services/ServiceList';
import AddServiceDialog from '@/components/services/AddServiceDialog';
import { fetchAllServices } from '@/lib/actions/services';
import { Service } from '@/lib/utils/serviceUtils';
import type { ServiceUnitType } from '@/lib/utils/serviceUnitTypes';

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const fetchedServices = await fetchAllServices();
        const normalized: Service[] = (fetchedServices as any[]).map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? undefined,
          default_qty: s.default_qty ?? 1,
          default_unit: (s.default_unit as ServiceUnitType) ?? 'flat_rate',
          default_unit_price_cents: s.default_unit_price_cents ?? 0,
          frequently_used: !!s.frequently_used,
          frequently_used_position: s.frequently_used_position ?? null,
        }));
        setServices(normalized);
      } catch (error) {
        console.error('Error loading services:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load services'
        );
      } finally {
        setLoading(false);
      }
    };

    loadServices();
  }, []);

  const frequentlyUsedServices = services
    .filter((s) => s.frequently_used)
    .sort((a, b) => {
      const posA = a.frequently_used_position ?? Number.MAX_VALUE;
      const posB = b.frequently_used_position ?? Number.MAX_VALUE;
      return posA - posB;
    });

  const otherServices = services.filter((s) => !s.frequently_used);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="50vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ mt: 4 }}>
          <Alert severity="error">{error}</Alert>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box sx={{ mt: 4, mb: 4 }}>
        <Grid
          container
          justifyContent="space-between"
          alignItems="center"
          sx={{ mb: 3 }}
        >
          <Grid item>
            <Typography variant="h4" component="h1" gutterBottom>
              Service Catalog
            </Typography>
            <Typography color="text.secondary" gutterBottom>
              Manage your alteration services and pricing
            </Typography>
          </Grid>
          <Grid item>
            <AddServiceDialog setServices={setServices} />
          </Grid>
        </Grid>

        {services.length === 0 ? (
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h6" gutterBottom>
              No services yet
            </Typography>
            <Typography color="text.secondary">
              Add your first service to get started
            </Typography>
          </Paper>
        ) : (
          <Box>
            {frequentlyUsedServices.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  Frequently Used Services
                </Typography>
                <ServiceList
                  services={frequentlyUsedServices}
                  setServices={setServices}
                />
              </Box>
            )}

            {otherServices.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                  {frequentlyUsedServices.length > 0
                    ? 'Other Services'
                    : 'All Services'}
                </Typography>
                <ServiceList
                  services={otherServices}
                  setServices={setServices}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Container>
  );
}
