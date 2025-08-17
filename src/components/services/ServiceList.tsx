'use client';

import { useState } from 'react';
import { Box, Grid } from '@mui/material';
import { toast } from 'react-hot-toast';

import ServiceItem from '@/components/services/ServiceItem';
import {
  editService,
  deleteService,
  duplicateService,
} from '@/lib/actions/services';
import {
  Service,
  ServiceFormData,
  convertServiceForDatabase,
} from '@/lib/utils/serviceUtils';

interface ServiceListProps {
  services: Service[];
  setServices: React.Dispatch<React.SetStateAction<Service[]>>;
}

export default function ServiceList({
  services,
  setServices,
}: ServiceListProps) {
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({});

  const handleEdit = async (id: string, updatedService: ServiceFormData) => {
    setIsLoading((prev) => ({ ...prev, [id]: true }));

    try {
      const serviceData = convertServiceForDatabase(updatedService);
      const updated = await editService(id, serviceData as any);

      // Map database result to Service type from serviceUtils
      const updatedForState: Service = {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        default_qty: updated.default_qty,
        default_unit: updated.default_unit,
        default_unit_price_cents: updated.default_unit_price_cents,
        frequently_used: updated.frequently_used,
        frequently_used_position: updated.frequently_used_position,
      };

      setServices((prevServices) =>
        prevServices.map((service) =>
          service.id === id ? updatedForState : service
        )
      );

      toast.success('Service updated successfully');
    } catch (error) {
      toast.error(
        `Error updating service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string) => {
    setIsLoading((prev) => ({ ...prev, [id]: true }));

    try {
      await deleteService(id);
      setServices((prevServices) =>
        prevServices.filter((service) => service.id !== id)
      );
      toast.success('Service deleted successfully');
    } catch (error) {
      toast.error(
        `Error deleting service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDuplicate = async (id: string) => {
    setIsLoading((prev) => ({ ...prev, [id]: true }));

    try {
      const duplicated = await duplicateService(id);

      // Map database result to Service type from serviceUtils
      const duplicatedForState: Service = {
        id: duplicated.id,
        name: duplicated.name,
        description: duplicated.description,
        default_qty: duplicated.default_qty,
        default_unit: duplicated.default_unit,
        default_unit_price_cents: duplicated.default_unit_price_cents,
        frequently_used: duplicated.frequently_used,
        frequently_used_position: duplicated.frequently_used_position,
      };

      setServices((prevServices) => [...prevServices, duplicatedForState]);
      toast.success('Service duplicated successfully');
    } catch (error) {
      toast.error(
        `Error duplicating service: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setIsLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  return (
    <Box>
      <Grid container spacing={2}>
        {services.map((service) => (
          <Grid item xs={12} key={service.id}>
            <ServiceItem
              service={service}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onDuplicate={handleDuplicate}
              isLoading={isLoading[service.id!] || false}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
