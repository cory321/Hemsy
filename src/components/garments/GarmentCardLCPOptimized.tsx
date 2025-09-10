import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Tooltip,
  Chip,
} from '@mui/material';
import SafeCldImage from '@/components/ui/SafeCldImage';
import InlinePresetSvg from '@/components/ui/InlinePresetSvg';
import { resolveGarmentDisplayImage } from '@/utils/displayImage';
import { getStageColor } from '@/constants/garmentStages';
import {
  getEnhancedDueDateInfo,
  type GarmentOverdueInfo,
} from '@/lib/utils/date-time-utils';
import { GarmentStage } from '@/types';

// ============================================================================
// LCP-OPTIMIZED GARMENT CARD
// ============================================================================
//
// Based on web.dev LCP guide, this component optimizes for:
// 1. Eager loading for above-the-fold images
// 2. High fetch priority for critical images
// 3. Optimized image sizes and formats
// 4. Reduced layout shift with aspect ratio containers
// ============================================================================

interface GarmentCardLCPOptimizedProps {
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
  // LCP optimization props
  isAboveFold?: boolean; // First few cards visible without scrolling
  priority?: boolean; // Explicit priority override
}

const GarmentCardLCPOptimized: React.FC<GarmentCardLCPOptimizedProps> = ({
  garment,
  orderId,
  stageColor,
  from = 'garments',
  isAboveFold = false,
  priority = false,
}) => {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/garments/${garment.id}?orderId=${orderId}&from=${from}`);
  };

  const dueDateInfo = getEnhancedDueDateInfo(garment as GarmentOverdueInfo);

  // Determine if this image should be prioritized for LCP
  const shouldPrioritizeImage = priority || isAboveFold;

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
        // Optimize for LCP - reduce layout shift
        aspectRatio: '1 / 1.3',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3,
          transition: 'all 0.3s ease',
        },
      }}
      onClick={handleClick}
    >
      {/* Image Section - LCP Optimized */}
      <Box
        sx={{
          position: 'relative',
          paddingTop: '100%',
          overflow: 'hidden',
          // Optimize for LCP rendering
          contain: 'layout style paint',
        }}
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
                // LCP OPTIMIZATION: Prioritize above-the-fold images
                priority={shouldPrioritizeImage}
                loading={shouldPrioritizeImage ? 'eager' : 'lazy'}
                fetchPriority={shouldPrioritizeImage ? 'high' : 'auto'}
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
                // LCP OPTIMIZATION: Add loading attributes
                loading={shouldPrioritizeImage ? 'eager' : 'lazy'}
                fetchPriority={shouldPrioritizeImage ? 'high' : 'auto'}
              />
            );
          }

          if (resolved.kind === 'preset' && resolved.src) {
            return (
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  bgcolor: 'grey.100',
                }}
              >
                <InlinePresetSvg
                  src={resolved.src}
                  fillColor={garment.preset_fill_color || '#9e9e9e'}
                  style={{
                    width: '60%',
                    height: '60%',
                    maxWidth: 120,
                    maxHeight: 120,
                  }}
                />
              </Box>
            );
          }

          // Fallback
          return (
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'grey.200',
              }}
            >
              <Typography variant="body2" color="text.secondary">
                No Image
              </Typography>
            </Box>
          );
        })()}
      </Box>

      {/* Content Section - Optimized for LCP */}
      <CardContent sx={{ flexGrow: 1, p: 2, pb: '16px !important' }}>
        {/* Garment Name */}
        <Typography
          variant="h6"
          component="h2"
          sx={{
            mb: 1,
            fontWeight: 600,
            fontSize: '1rem',
            lineHeight: 1.2,
            // Optimize text rendering for LCP
            fontDisplay: 'swap',
          }}
        >
          {garment.name}
        </Typography>

        {/* Client Name */}
        {garment.client_name && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 1, fontDisplay: 'swap' }}
          >
            {garment.client_name}
          </Typography>
        )}

        {/* Due Date with Status */}
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
                  backgroundColor: '#EEBA8C',
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

        {/* Stage */}
        <Typography
          variant="caption"
          sx={{
            display: 'block',
            color:
              stageColor ||
              (garment.stage ? getStageColor(garment.stage) : '#666'),
            fontWeight: 500,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            fontDisplay: 'swap',
          }}
        >
          {garment.stage || 'Unknown'}
        </Typography>
      </CardContent>
    </Card>
  );
};

export default GarmentCardLCPOptimized;
