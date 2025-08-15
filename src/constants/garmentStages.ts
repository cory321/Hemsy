import { GarmentStage } from '@/types';

export interface StageConfig {
  name: GarmentStage;
  color: string;
  displayName: string;
}

export const GARMENT_STAGES: StageConfig[] = [
  {
    name: 'New',
    color: '#49D4B7',
    displayName: 'New',
  },
  {
    name: 'In Progress',
    color: '#FFD052',
    displayName: 'In Progress',
  },
  {
    name: 'Ready For Pickup',
    color: '#AA99EC',
    displayName: 'Ready For Pickup',
  },
  {
    name: 'Done',
    color: '#D2D9E5',
    displayName: 'Done',
  },
];

export const STAGE_COLORS: Record<GarmentStage, string> = {
  New: '#B8E1C6',
  'In Progress': '#FFF5BA',
  'Ready For Pickup': '#E4C1F9',
  Done: '#D2D9E5',
};

export const getStageColor = (stage: GarmentStage): string => {
  return STAGE_COLORS[stage] || '#D6C4F2';
};
