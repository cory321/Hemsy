'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useAuth, useUser } from '@clerk/nextjs';
import {
  Button,
  Box,
  Typography,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
} from '@mui/material';

import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { getGarmentsAndStages } from '@/lib/actions/garment-stages';
import { GARMENT_STAGES, getStageColor } from '@/constants/garmentStages';
import { getCurrentUserShop } from '@/lib/actions/shops';
import GarmentCard from '@/components/garments/GarmentCard';
import { GarmentStage } from '@/types';

import StageBox from '@/components/garments/StageBox';
import {
  getGarmentSortComparator,
  groupGarmentsByClientName,
} from '@/utils/garments-sort';

type GarmentListItem = {
  id: string;
  name: string;
  order_id: string;
  stage: GarmentStage;
  stage_name?: string;
  client_name?: string;
  photo_url?: string;
  image_cloud_id?: string;
  preset_icon_key?: string | null;
  preset_fill_color?: string | null;
  due_date?: string;
  event_date?: string;
  services?: any[];
};

export default function GarmentsPage() {
  const [garmentsData, setGarmentsData] = useState<GarmentListItem[]>([]);

  const [selectedStage, setSelectedStage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [sortField, setSortField] = useState<
    'due_date' | 'created_at' | 'client_name' | 'name' | 'overdue' | 'due_soon'
  >('due_date');
  const [shopId, setShopId] = useState<string | null>(null);
  const { userId } = useAuth();
  const { user } = useUser();

  const fetchGarmentsData = useCallback(async () => {
    try {
      setIsLoading(true);

      // Get the current user's shop
      const shop = await getCurrentUserShop();
      if (!shop) {
        console.error('No shop found for user');
        return;
      }

      setShopId(shop.id);

      const { garments } = await getGarmentsAndStages(shop.id);

      console.log('Fetched garments:', garments);

      setGarmentsData(
        garments.map(
          (garment): GarmentListItem => ({
            id: garment.id as string,
            name: garment.name as string,
            order_id: garment.order_id as string,
            stage: (garment.stage as GarmentStage) || 'New',
            ...(garment.stage_name
              ? { stage_name: garment.stage_name as string }
              : {}),
            client_name:
              (garment.client_name as string | undefined) || 'Unknown Client',
            ...(garment.photo_url
              ? { photo_url: garment.photo_url as string }
              : {}),
            ...(garment.image_cloud_id
              ? { image_cloud_id: garment.image_cloud_id as string }
              : {}),
            ...(garment.preset_icon_key
              ? { preset_icon_key: garment.preset_icon_key as string }
              : {}),
            ...(garment.preset_fill_color
              ? { preset_fill_color: garment.preset_fill_color as string }
              : {}),
            ...(garment.due_date
              ? { due_date: garment.due_date as string }
              : {}),
            ...(garment.event_date
              ? { event_date: garment.event_date as string }
              : {}),
            ...(garment.services
              ? { services: garment.services as any[] }
              : {}),
          })
        )
      );
    } catch (error) {
      console.error('Failed to fetch garments data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (userId) {
      fetchGarmentsData();
    }
  }, [fetchGarmentsData, userId]);

  // Compute counts of garments per stage
  const garmentCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};

    garmentsData.forEach((garment) => {
      const stageName = garment.stage_name || 'New';
      counts[stageName] = (counts[stageName] || 0) + 1;
    });

    return counts;
  }, [garmentsData]);

  const totalGarments = garmentsData.length;

  const filteredGarments = useMemo<GarmentListItem[]>(() => {
    let garments: GarmentListItem[] = garmentsData;

    if (selectedStage) {
      garments = garments.filter(
        (garment) => (garment.stage_name || 'New') === selectedStage
      );
    }

    // Sort the garments by the selected field, including special orders for overdue/due soon
    const comparator = getGarmentSortComparator(sortField, sortOrder);
    garments = garments.slice().sort(comparator);

    return garments;
  }, [garmentsData, selectedStage, sortOrder, sortField]);

  // Group garments by client name if sorting by client_name
  const groupedGarments = useMemo(() => {
    if (sortField !== 'client_name') return null;
    return groupGarmentsByClientName(filteredGarments, sortOrder);
  }, [filteredGarments, sortOrder, sortField]);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Box sx={{ p: 3 }}>
      {/* Stage Selection */}
      {!isMobile ? (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            mb: 3,
            gap: 2,
          }}
        >
          {/* "View All" Stage */}
          <StageBox
            stage={{ name: 'View All', count: totalGarments }}
            isSelected={!selectedStage}
            onClick={() => setSelectedStage(null)}
            isLast={false}
          />
          {GARMENT_STAGES.map((stage, index) => (
            <StageBox
              key={stage.name}
              stage={{
                name: stage.displayName,
                color: stage.color,
                count: garmentCounts[stage.name] || 0,
              }}
              isSelected={selectedStage === stage.name}
              onClick={() => setSelectedStage(stage.name)}
              isLast={index === GARMENT_STAGES.length - 1}
            />
          ))}
        </Box>
      ) : (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="stage-select-label">Select Stage</InputLabel>
          <Select
            labelId="stage-select-label"
            value={selectedStage || ''}
            label="Select Stage"
            onChange={(e) => {
              const stageName = e.target.value;
              setSelectedStage(stageName || null);
            }}
          >
            <MenuItem value="">
              <em>View All ({totalGarments})</em>
            </MenuItem>
            {GARMENT_STAGES.map((stage) => (
              <MenuItem key={stage.name} value={stage.name}>
                {stage.displayName} ({garmentCounts[stage.name] || 0})
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      )}

      {/* Sorting Options */}
      <Box
        sx={{
          mb: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        {/* Sorting Controls */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <FormControl
            variant="outlined"
            size="small"
            sx={{ mr: 2, minWidth: 200 }}
          >
            <InputLabel>Sort By</InputLabel>
            <Select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as typeof sortField)}
              label="Sort By"
            >
              <MenuItem value="due_date">Due Date</MenuItem>
              <MenuItem value="created_at">Date Created</MenuItem>
              <MenuItem value="client_name">Client Name</MenuItem>
              <MenuItem value="overdue">Overdue first</MenuItem>
              <MenuItem value="due_soon">Due soon first</MenuItem>
            </Select>
          </FormControl>

          <Tooltip title={sortOrder === 'asc' ? 'Ascending' : 'Descending'}>
            <IconButton
              onClick={() =>
                setSortOrder((prevOrder) =>
                  prevOrder === 'asc' ? 'desc' : 'asc'
                )
              }
            >
              {sortOrder === 'asc' ? (
                <ArrowUpwardIcon />
              ) : (
                <ArrowDownwardIcon />
              )}
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Garments Grid */}
      {isLoading ? (
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '50vh',
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredGarments.length === 0 ? (
        <Typography>No garments found for this stage.</Typography>
      ) : sortField === 'client_name' ? (
        groupedGarments?.sortedClientNames.map((clientName) => (
          <Box key={clientName} sx={{ mb: 4 }}>
            {/* Styled Container for Client Name */}
            <Box
              sx={{
                backgroundColor: '#e3e5f1',
                p: 2, // Padding
                borderRadius: 1,
                mb: 2,
              }}
            >
              <Typography
                variant="h5"
                sx={{ color: (theme) => theme.palette.text.primary }}
              >
                {clientName}
              </Typography>
            </Box>

            {/* Garments Grid for the Client */}
            <Grid
              container
              spacing={3}
              columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}
            >
              {groupedGarments.groups[clientName]?.map((garment) => (
                <Grid item xs={4} sm={4} md={4} lg={4} key={garment.id}>
                  <GarmentCard
                    garment={garment}
                    orderId={garment.order_id}
                    stageColor={getStageColor(
                      (garment.stage_name || 'New') as any
                    )}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      ) : (
        <Grid container spacing={3} columns={{ xs: 4, sm: 8, md: 12, lg: 20 }}>
          {filteredGarments.map((garment) => (
            <Grid item xs={4} sm={4} md={4} lg={4} key={garment.id}>
              <GarmentCard
                garment={garment}
                orderId={garment.order_id}
                stageColor={getStageColor((garment.stage_name || 'New') as any)}
              />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
