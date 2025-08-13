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
import SettingsIcon from '@mui/icons-material/Settings';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';

import { getGarmentsAndStages } from '@/lib/actions/garment-stages';
import { getCurrentUserShop } from '@/lib/actions/shops';
import GarmentCard from '@/components/garments/GarmentCard';
import CustomizeStagesDialog from '@/components/garments/CustomizeStagesDialog';
import StageBox from '@/components/garments/StageBox';
import {
  getGarmentSortComparator,
  groupGarmentsByClientName,
} from '@/utils/garments-sort';

type GarmentListItem = {
  id: string;
  name: string;
  order_id: string;
  stage_id: string;
  stage_name?: string;
  stage_color?: string | null;
  client_name?: string;
  photo_url?: string | null;
  image_cloud_id?: string | null;
  due_date?: string | null;
  event_date?: string | null;
  services?: any[];
};

type StageItem = {
  id: string;
  name: string;
  color: string | null;
  position: number;
};

export default function GarmentsPage() {
  const [garmentsData, setGarmentsData] = useState<GarmentListItem[]>([]);
  const [stages, setStages] = useState<StageItem[]>([]);
  const [selectedStage, setSelectedStage] = useState<StageItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [customizeDialogOpen, setCustomizeDialogOpen] = useState(false);
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

      const { garments, stages: fetchedStages } = await getGarmentsAndStages(
        shop.id
      );

      console.log('Fetched garments:', garments);
      console.log('Fetched stages:', fetchedStages);

      setGarmentsData(
        garments.map((garment) => ({
          ...garment,
          client_name: garment.client_name || 'Unknown Client',
        }))
      );
      setStages(fetchedStages);
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

  const handleStagesUpdated = async (deletedStageId?: string) => {
    console.log('handleStagesUpdated called');
    await fetchGarmentsData();

    if (
      deletedStageId &&
      selectedStage &&
      selectedStage.id === deletedStageId
    ) {
      setSelectedStage(null);
    }
  };

  // Compute counts of garments per stage
  const garmentCounts = useMemo<Record<string, number>>(() => {
    const counts: Record<string, number> = {};

    garmentsData.forEach((garment) => {
      const stageId = garment.stage_id;
      counts[stageId] = (counts[stageId] || 0) + 1;
    });

    return counts;
  }, [garmentsData]);

  const totalGarments = garmentsData.length;

  const filteredGarments = useMemo<GarmentListItem[]>(() => {
    let garments: GarmentListItem[] = garmentsData;

    if (selectedStage) {
      garments = garments.filter(
        (garment) => garment.stage_id === selectedStage.id
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
            overflowX: 'scroll',
            overflowY: 'hidden',
            pb: 4,
          }}
        >
          {/* "View All" Stage */}
          <StageBox
            stage={{ name: 'View All', count: totalGarments }}
            isSelected={!selectedStage}
            onClick={() => setSelectedStage(null)}
            isLast={false}
          />
          {stages.map((stage, index) => (
            <StageBox
              key={stage.id}
              stage={{ ...stage, count: garmentCounts[stage.id] || 0 }}
              isSelected={selectedStage?.id === stage.id}
              onClick={() => setSelectedStage(stage)}
              isLast={index === stages.length - 1}
            />
          ))}
        </Box>
      ) : (
        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="stage-select-label">Select Stage</InputLabel>
          <Select
            labelId="stage-select-label"
            value={selectedStage?.id || ''}
            label="Select Stage"
            onChange={(e) => {
              const stageId = e.target.value;
              const stage = stages.find((s) => s.id === stageId) || null;

              setSelectedStage(stage);
            }}
          >
            <MenuItem value="">
              <em>View All ({totalGarments})</em>
            </MenuItem>
            {stages.map((stage) => (
              <MenuItem key={stage.id} value={stage.id}>
                {stage.name} ({garmentCounts[stage.id] || 0})
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
              onChange={(e) => setSortField(e.target.value)}
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

        {/* Customize Stages Button */}
        {!isMobile && (
          <Button
            variant="outlined"
            onClick={() => setCustomizeDialogOpen(true)}
            startIcon={<SettingsIcon />}
          >
            Customize Stages
          </Button>
        )}
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
              <Typography variant="h5" sx={{ color: '#000' }}>
                {clientName}
              </Typography>
            </Box>

            {/* Garments Grid for the Client */}
            <Grid container spacing={3}>
              {groupedGarments.groups[clientName].map((garment) => (
                <Grid item xs={12} sm={6} md={4} lg={3} key={garment.id}>
                  <GarmentCard
                    garment={garment}
                    orderId={garment.order_id}
                    stageColor={
                      stages.find((stage) => stage.id === garment.stage_id)
                        ?.color
                    }
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        ))
      ) : (
        <Grid container spacing={3}>
          {filteredGarments.map((garment) => (
            <Grid item xs={12} sm={6} md={4} lg={3} key={garment.id}>
              <GarmentCard
                garment={garment}
                orderId={garment.order_id}
                stageColor={
                  stages.find((stage) => stage.id === garment.stage_id)?.color
                }
              />
            </Grid>
          ))}
        </Grid>
      )}

      {/* Customize Stages Dialog */}
      {shopId && (
        <CustomizeStagesDialog
          open={customizeDialogOpen}
          onClose={() => setCustomizeDialogOpen(false)}
          onStagesUpdated={handleStagesUpdated}
          stages={stages}
          shopId={shopId}
        />
      )}
    </Box>
  );
}
