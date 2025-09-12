import { GarmentStage } from '@/types';

export interface StageConfig {
  name: GarmentStage;
  color: string;
  displayName: string;
}

export const GARMENT_STAGES: StageConfig[] = [
  {
    name: 'New',
    color: '#a3b5aa',
    displayName: 'New',
  },
  {
    name: 'In Progress',
    color: '#F3C165',
    displayName: 'In Progress',
  },
  {
    name: 'Ready For Pickup',
    color: '#BD8699',
    displayName: 'Ready For Pickup',
  },
  {
    name: 'Done',
    color: '#c3b3d1',
    displayName: 'Done',
  },
];

export const STAGE_COLORS: Record<GarmentStage, string> = {
  New: '#a3b5aa',
  'In Progress': '#F3C165',
  'Ready For Pickup': '#BD8699',
  Done: '#c3b3d1',
};

export const getStageColor = (stage: GarmentStage): string => {
  return STAGE_COLORS[stage] || '#D6C4F2';
};
