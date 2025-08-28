/**
 * Client-side garment stage calculation utility
 * Mirrors the server-side logic from garment-stage-helpers.ts
 */

export type GarmentStage = 'New' | 'In Progress' | 'Ready For Pickup' | 'Done';

export interface Service {
  id: string;
  is_done?: boolean;
  is_removed?: boolean;
}

export interface StageCalculationResult {
  stage: GarmentStage;
  completedCount: number;
  totalCount: number;
}

/**
 * Calculates the garment stage based on service completion status
 * This mirrors the server-side calculateGarmentStage function
 */
export function calculateGarmentStageClient(
  services: Service[]
): StageCalculationResult {
  // Filter out removed services (soft-deleted)
  const activeServices = services.filter((s) => !s.is_removed);

  const completedCount = activeServices.filter(
    (s) => s.is_done === true
  ).length;
  const totalCount = activeServices.length;

  let stage: GarmentStage;

  if (totalCount === 0) {
    // No services, default to 'New'
    stage = 'New';
  } else if (completedCount === 0) {
    stage = 'New';
  } else if (completedCount === totalCount) {
    stage = 'Ready For Pickup';
  } else {
    stage = 'In Progress';
  }

  return { stage, completedCount, totalCount };
}

/**
 * Determines if a stage change should be applied optimistically
 * Don't automatically change from 'Done' back to another stage
 */
export function shouldUpdateStageOptimistically(
  currentStage: GarmentStage,
  newStage: GarmentStage
): boolean {
  // Don't automatically change from 'Done' back to another stage
  if (currentStage === 'Done') {
    return false;
  }

  // Only update if the stage is actually changing
  return currentStage !== newStage;
}
