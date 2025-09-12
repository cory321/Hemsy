import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Tooltip,
  Chip,
} from '@mui/material';
import SafeCldImage from '@/components/ui/SafeCldImage';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { resolveGarmentDisplayImage } from '@/utils/displayImage';
import { getStageColor } from '@/constants/garmentStages';
import {
  getEnhancedDueDateInfo,
  formatDateSafe,
  type GarmentOverdueInfo,
} from '@/lib/utils/date-time-utils';
import { GarmentStage } from '@/types';

interface GarmentCardProps {
  garment: {
    id: string;
    name: string;
    image_cloud_id?: string;
    photo_url?: string;
    preset_icon_key?: string | null;
    preset_fill_color?: string | null;
    client_name?: string;
    due_date?: string;
    event_date?: string;
    services?: any[];
    garment_services?: Array<{
      id: string;
      is_done?: boolean | null;
      is_removed?: boolean | null;
    }> | null;
    stage?: GarmentStage;
    stage_name?: string | undefined;
  };
  orderId: string;
  stageColor?: string;
  from?: string;
}

const GarmentCard: React.FC<GarmentCardProps> = ({
  garment,
  orderId,
  stageColor,
  from = 'garments',
}) => {
  const router = useRouter();

  const handleClick = () => {
    if (from === 'dashboard' || from === 'garments') {
      router.push(`/garments/${garment.id}`);
    } else {
      // Fallback to legacy order-scoped garment route if needed
      router.push(`/orders/${orderId}/${garment.id}`);
    }
  };

  const totalServicePrice =
    garment.services?.reduce(
      (sum, service) =>
        sum +
        ((service.quantity || service.qty || 0) *
          (service.unit_price_cents || service.unit_price || 0)) /
          100,
      0
    ) || 0;

  // Get due date information using the enhanced utility that considers service completion
  const dueDateInfo = getEnhancedDueDateInfo(garment as GarmentOverdueInfo);

  return (
    <Card
      data-testid="garment-card"
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        cursor: 'pointer',
        position: 'relative',
        borderTop: `4px solid ${stageColor || (garment.stage ? getStageColor(garment.stage) : '#ccc')}`,
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
          transition: 'all 0.3s ease',
        },
      }}
      onClick={handleClick}
    >
      {/* Image Section */}
      <Box
        sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden' }}
      >
        {(() => {
          const resolved = resolveGarmentDisplayImage({
            photoUrl: garment.photo_url ?? undefined,
            cloudPublicId: garment.image_cloud_id ?? undefined,
            presetIconKey: garment.preset_icon_key ?? undefined,
          } as any);
          if (resolved.kind === 'cloud') {
            return (
              <SafeCldImage
                src={garment.image_cloud_id as string}
                alt={garment.name}
                fill
                style={{ objectFit: 'cover' }}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                fallbackIconKey={garment.preset_icon_key}
                fallbackIconColor={garment.preset_fill_color}
              />
            );
          }
          if (resolved.kind === 'photo') {
            return (
              <Box
                component="img"
                src={resolved.src as string}
                alt={garment.name}
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            );
          }
          if (resolved.kind === 'preset' && resolved.src) {
            return (
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: '#f5f5f5',
                  p: 2,
                  overflow: 'hidden',
                }}
              >
                <Box
                  sx={{
                    height: '88%',
                    width: '88%',
                    maxWidth: '88%',
                    maxHeight: '88%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                >
                  <InlinePresetSvg
                    src={resolved.src as string}
                    fillColor={(garment.preset_fill_color ?? undefined) as any}
                    style={{
                      height: '100%',
                      width: '100%',
                      maxWidth: '100%',
                      maxHeight: '100%',
                    }}
                  />
                </Box>
              </Box>
            );
          }
          return (
            <Box
              sx={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: '#f5f5f5',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Avatar sx={{ width: 80, height: 80, bgcolor: '#e0e0e0' }}>
                <Typography variant="h6" color="text.secondary">
                  {garment.name.charAt(0)}
                </Typography>
              </Avatar>
            </Box>
          );
        })()}
      </Box>

      <CardContent sx={{ flexGrow: 1, p: 2 }}>
        {/* Garment Name */}
        <Typography variant="h6" gutterBottom noWrap data-testid="garment-name">
          {garment.name}
        </Typography>

        {/* Client Name */}
        {garment.client_name && (
          <Typography variant="body2" color="text.secondary" gutterBottom>
            {garment.client_name}
          </Typography>
        )}

        {/* Due Date or Status Chip */}
        {(garment.due_date && dueDateInfo) || garment.stage === 'Done' ? (
          <Box sx={{ mb: 1 }}>
            <Chip
              label={
                garment.stage === 'Done'
                  ? 'Done'
                  : dueDateInfo?.isPast && dueDateInfo?.allServicesCompleted
                    ? 'Ready for Pickup'
                    : dueDateInfo?.isOverdue
                      ? `${Math.abs(dueDateInfo.daysUntilDue)} days overdue`
                      : dueDateInfo?.isToday
                        ? 'Due today'
                        : dueDateInfo?.isTomorrow
                          ? 'Due tomorrow'
                          : `Due in ${dueDateInfo?.daysUntilDue} days`
              }
              size="small"
              sx={{
                ...(dueDateInfo?.isPast &&
                  dueDateInfo?.allServicesCompleted &&
                  garment.stage !== 'Done' && {
                    backgroundColor: '#BD8699',
                    color: 'white',
                    fontWeight: 600,
                  }),
                ...(dueDateInfo?.isToday && {
                  backgroundColor: '#F3C165',
                  color: 'black',
                  fontWeight: 600,
                }),
                ...(garment.stage === 'Done' && {
                  backgroundColor: '#c3b3d1',
                  color: '#4a4a4a',
                  fontWeight: 600,
                }),
              }}
              {...(!(
                garment.stage === 'Done' ||
                (dueDateInfo?.isPast && dueDateInfo?.allServicesCompleted) ||
                dueDateInfo?.isToday
              ) && {
                color: dueDateInfo?.isOverdue
                  ? 'error'
                  : dueDateInfo?.isUrgent
                    ? 'warning'
                    : 'default',
              })}
            />
          </Box>
        ) : null}

        {/* Event Date */}
        {garment.event_date && (
          <Typography variant="caption" color="text.secondary" display="block">
            Event: {formatDateSafe(garment.event_date)}
          </Typography>
        )}

        {/* Total Price */}
        {totalServicePrice > 0 && (
          <Typography variant="body2" fontWeight="bold" sx={{ mt: 1 }}>
            ${totalServicePrice.toFixed(2)}
          </Typography>
        )}

        {/* Stage */}
        {garment.stage_name && (
          <Tooltip title={`Stage: ${garment.stage_name}`}>
            <Box
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                width: 12,
                height: 12,
                borderRadius: '50%',
                backgroundColor:
                  stageColor ||
                  (garment.stage ? getStageColor(garment.stage) : '#ccc'),
              }}
            />
          </Tooltip>
        )}
      </CardContent>
    </Card>
  );
};

export default GarmentCard;
