/**
 * Utility functions for garment priority and sorting
 */

import type { GarmentStage } from '@/types';
import { isGarmentOverdue, type GarmentOverdueInfo } from './overdue-logic';

/**
 * Get the priority score for a garment stage
 * Higher score = higher priority (should be shown first)
 *
 * When garments have the same due date, we prioritize:
 * 1. Ready For Pickup (score: 3) - Can be delivered immediately
 * 2. In Progress (score: 2) - Work has started
 * 3. New (score: 1) - No work started yet
 *
 * Note: "Done" garments should be filtered out before sorting
 */
export function getStagePriorityScore(stage: GarmentStage): number {
  switch (stage) {
    case 'Ready For Pickup':
      return 3;
    case 'In Progress':
      return 2;
    case 'New':
      return 1;
    case 'Done':
      // Done garments should be filtered out before using this function
      // But if they somehow get here, give them the lowest priority
      return -1;
    default:
      return 0;
  }
}

/**
 * Compare two garments for sorting with stage-based priority
 * This is meant to be used as a secondary sort when due dates are equal
 *
 * @returns negative if a should come before b, positive if b should come before a
 */
export function compareGarmentsByStageAndProgress(
  a: { stage: GarmentStage; progress?: number },
  b: { stage: GarmentStage; progress?: number }
): number {
  const aScore = getStagePriorityScore(a.stage);
  const bScore = getStagePriorityScore(b.stage);

  // If stages are different, sort by stage priority
  if (aScore !== bScore) {
    return bScore - aScore; // Higher score first
  }

  // If both are "In Progress" and we have progress data, sort by progress (higher first)
  if (a.stage === 'In Progress' && b.stage === 'In Progress') {
    const aProgress = a.progress ?? 0;
    const bProgress = b.progress ?? 0;
    if (aProgress !== bProgress) {
      return bProgress - aProgress; // Higher progress first
    }
  }

  // Otherwise, maintain original order
  return 0;
}

/**
 * Enhanced garment sorting function that considers both due date and stage
 *
 * Priority order:
 * 1. Overdue items (sorted by how overdue, then by stage/progress)
 *    - Excludes garments with all services completed (Ready For Pickup)
 * 2. Due today (sorted by stage/progress)
 * 3. Due tomorrow (sorted by stage/progress)
 * 4. Future items with due dates (sorted by date, then stage/progress)
 * 5. Items without due dates (sorted by stage/progress)
 */
export function sortGarmentsByPriority<
  T extends {
    due_date?: string | null;
    stage: GarmentStage;
    progress?: number;
    garment_services?: Array<{
      id: string;
      is_done?: boolean | null;
      is_removed?: boolean | null;
    }> | null;
  },
>(garments: T[]): T[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [...garments].sort((a, b) => {
    // Parse due dates
    const aDueDate = a.due_date ? new Date(a.due_date) : null;
    const bDueDate = b.due_date ? new Date(b.due_date) : null;

    // If both have dates, clear the time portion for comparison
    if (aDueDate) aDueDate.setHours(0, 0, 0, 0);
    if (bDueDate) bDueDate.setHours(0, 0, 0, 0);

    // No due dates - sort by stage/progress only
    if (!aDueDate && !bDueDate) {
      return compareGarmentsByStageAndProgress(a, b);
    }

    // One has a due date, one doesn't - prioritize the one with a due date
    if (!aDueDate) return 1;
    if (!bDueDate) return -1;

    // Both have due dates - categorize and sort
    const aTime = aDueDate.getTime();
    const bTime = bDueDate.getTime();
    const todayTime = today.getTime();
    const tomorrowTime = tomorrow.getTime();

    // Use the new overdue logic that considers service completion
    const aIsOverdue = isGarmentOverdue(a as GarmentOverdueInfo);
    const bIsOverdue = isGarmentOverdue(b as GarmentOverdueInfo);
    const aIsToday = aTime === todayTime;
    const bIsToday = bTime === todayTime;
    const aIsTomorrow = aTime === tomorrowTime;
    const bIsTomorrow = bTime === tomorrowTime;

    // Both overdue (considering service completion)
    if (aIsOverdue && bIsOverdue) {
      // Sort by how overdue (most overdue first)
      const dateDiff = aTime - bTime;
      if (dateDiff !== 0) return dateDiff;
      // Same overdue date - sort by stage/progress
      return compareGarmentsByStageAndProgress(a, b);
    }

    // One is overdue (considering service completion)
    if (aIsOverdue) return -1;
    if (bIsOverdue) return 1;

    // Both due today
    if (aIsToday && bIsToday) {
      return compareGarmentsByStageAndProgress(a, b);
    }

    // One is due today
    if (aIsToday) return -1;
    if (bIsToday) return 1;

    // Both due tomorrow
    if (aIsTomorrow && bIsTomorrow) {
      return compareGarmentsByStageAndProgress(a, b);
    }

    // One is due tomorrow
    if (aIsTomorrow) return -1;
    if (bIsTomorrow) return 1;

    // Both are future dates
    const dateDiff = aTime - bTime;
    if (dateDiff !== 0) return dateDiff; // Earlier date first

    // Same future date - sort by stage/progress
    return compareGarmentsByStageAndProgress(a, b);
  });
}
