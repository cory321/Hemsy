'use client';

import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

import EditServiceDialog from '@/components/services/EditServiceDialog';
import {
  Service,
  ServiceFormData,
  calculateTotalPrice,
} from '@/lib/utils/serviceUtils';
import { pluralizeUnit } from '@/lib/utils/unitUtils';

interface ServiceItemProps {
  service: Service;
  onDelete: (id: string) => Promise<void>;
  onEdit: (id: string, updatedService: ServiceFormData) => Promise<void>;
  isLoading?: boolean;
}

const ServiceItem: React.FC<ServiceItemProps> = ({
  service,
  onDelete,
  onEdit,
  isLoading = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleDelete = async (id: string) => {
    await onDelete(id);
  };

  const handleSave = async (updatedService: ServiceFormData) => {
    if (service.id) {
      await onEdit(service.id, updatedService);
    }
    setIsEditing(false);
  };

  return (
    <>
      <Card
        variant="outlined"
        sx={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          cursor: 'pointer',
          transition: 'all 0.2s ease-in-out',
          opacity: isLoading ? 0.6 : 1,
          position: 'relative',
          '&:hover': {
            boxShadow: (theme) => theme.shadows[4],
            transform: 'translateY(-2px)',
            borderColor: 'primary.main',
          },
        }}
        onClick={() => {
          setIsEditing(true);
        }}
      >
        <CardContent
          sx={{
            flexGrow: 1,
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            '&:last-child': { pb: 3 },
          }}
        >
          {/* Header: Service Name + Price */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              mb: 2,
            }}
          >
            {/* Left: Service Name */}
            <Box sx={{ flexGrow: 1, minWidth: 0, mr: 2 }}>
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                  color: 'text.primary',
                  wordBreak: 'break-word',
                  mb: 0.5,
                }}
              >
                {service.name}
              </Typography>
            </Box>

            {/* Right: Price */}
            <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
              <Typography
                variant="h5"
                color="primary.main"
                sx={{
                  fontWeight: 700,
                  lineHeight: 1.2,
                }}
              >
                {calculateTotalPrice(service)}
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  fontWeight: 500,
                  display: 'block',
                }}
              >
                {service.default_unit === 'flat_rate'
                  ? 'Flat Rate'
                  : `$${(service.default_unit_price_cents / 100).toFixed(2)}/${service.default_unit}`}
              </Typography>
            </Box>
          </Box>

          {/* Secondary Info: Badges + Unit Details */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              mb: service.description ? 2 : 'auto',
              flexWrap: 'wrap',
            }}
          >
            {/* Frequently Used Badge */}
            {service.frequently_used && (
              <Chip
                icon={<StarIcon sx={{ fontSize: '14px !important' }} />}
                label="Frequently Used"
                size="small"
                color="primary"
                variant="filled"
                sx={{
                  fontWeight: 600,
                  fontSize: '0.75rem',
                  height: 24,
                  '& .MuiChip-icon': {
                    color: 'primary.contrastText',
                  },
                }}
              />
            )}

            {/* Unit Details */}
            {service.default_unit !== 'flat_rate' && (
              <Chip
                icon={
                  service.default_unit === 'hour' ? (
                    <AccessTimeIcon sx={{ fontSize: '14px !important' }} />
                  ) : (
                    <AttachMoneyIcon sx={{ fontSize: '14px !important' }} />
                  )
                }
                label={`${service.default_qty} ${pluralizeUnit(service.default_unit, service.default_qty)}`}
                size="small"
                variant="outlined"
                sx={{
                  fontSize: '0.75rem',
                  height: 24,
                  color: 'text.secondary',
                  borderColor: 'divider',
                }}
              />
            )}
          </Box>

          {/* Description */}
          {service.description && (
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                mt: 'auto',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {service.description}
            </Typography>
          )}
        </CardContent>
      </Card>

      {isEditing && (
        <EditServiceDialog
          service={service}
          open={isEditing}
          onClose={() => setIsEditing(false)}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}
    </>
  );
};

export default ServiceItem;
