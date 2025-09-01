export type GarmentLike = {
  id?: string;
  name?: string;
  client_name?: string | null;
  due_date?: string | null;
  created_at?: string | null;
  stage?: string | null;
  garment_services?: Array<{
    id: string;
    is_done?: boolean | null;
    is_removed?: boolean | null;
  }> | null;
};

export type GarmentSortField =
  | 'due_date'
  | 'created_at'
  | 'client_name'
  | 'name'
  | 'overdue'
  | 'due_soon';
export type GarmentSortOrder = 'asc' | 'desc';

import {
  isGarmentOverdue,
  type GarmentOverdueInfo,
} from '@/lib/utils/overdue-logic';

const DUE_SOON_DAYS = 3;

function parseDate(value?: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function daysUntil(dateString?: string | null): number | null {
  const date = parseDate(dateString);
  if (!date) return null;
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const msInDay = 1000 * 60 * 60 * 24;
  return Math.ceil((target.getTime() - today.getTime()) / msInDay);
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function compareStrings(
  a?: string | null,
  b?: string | null,
  order: GarmentSortOrder = 'asc'
): number {
  const aa = (a || '').toLowerCase();
  const bb = (b || '').toLowerCase();
  return order === 'asc' ? aa.localeCompare(bb) : bb.localeCompare(aa);
}

function compareDates(
  a?: string | null,
  b?: string | null,
  order: GarmentSortOrder = 'asc'
): number {
  const da = parseDate(a);
  const db = parseDate(b);

  const aTime = da ? da.getTime() : -Infinity; // null dates sort to beginning in asc by default
  const bTime = db ? db.getTime() : -Infinity;

  return order === 'asc' ? aTime - bTime : bTime - aTime;
}

// Category rank helpers for special sorts
function rankForOverdue(garment: GarmentLike): number {
  const dueDays = daysUntil(garment.due_date);

  // 0=overdue (considering service completion), 1=today, 2=due soon, 3=future, 4=no due date
  if (dueDays === null) return 4;

  // Check if truly overdue (considering service completion)
  if (dueDays < 0 && isGarmentOverdue(garment as GarmentOverdueInfo)) return 0;

  if (dueDays === 0) return 1;
  if (dueDays <= DUE_SOON_DAYS) return 2;
  return 3;
}

function rankForDueSoon(garment: GarmentLike): number {
  const dueDays = daysUntil(garment.due_date);

  // 0=today, 1=due soon, 2=future, 3=overdue (considering service completion), 4=no due date
  if (dueDays === null) return 4;
  if (dueDays === 0) return 0;
  if (dueDays > 0 && dueDays <= DUE_SOON_DAYS) return 1;
  if (dueDays > DUE_SOON_DAYS) return 2;

  // Check if truly overdue (considering service completion)
  if (isGarmentOverdue(garment as GarmentOverdueInfo)) return 3;

  return 2; // Past due but all services completed, treat as future
}

export function getGarmentSortComparator(
  field: GarmentSortField,
  order: GarmentSortOrder = 'asc'
) {
  return (a: GarmentLike, b: GarmentLike): number => {
    if (field === 'client_name' || field === 'name') {
      return compareStrings(a[field], b[field], order);
    }

    if (field === 'due_date' || field === 'created_at') {
      return compareDates(a[field], b[field], order);
    }

    if (field === 'overdue') {
      const rankA = rankForOverdue(a);
      const rankB = rankForOverdue(b);
      if (rankA !== rankB) return rankA - rankB;
      // tie-breaker by nearest due date
      return compareDates(a.due_date, b.due_date, order);
    }

    if (field === 'due_soon') {
      const rankA = rankForDueSoon(a);
      const rankB = rankForDueSoon(b);
      if (rankA !== rankB) return rankA - rankB;
      // tie-breaker by nearest due date
      return compareDates(a.due_date, b.due_date, order);
    }

    return 0;
  };
}

export function groupGarmentsByClientName<T extends GarmentLike>(
  garments: T[],
  order: GarmentSortOrder = 'asc'
): { groups: Record<string, T[]>; sortedClientNames: string[] } {
  const groups: Record<string, T[]> = garments.reduce(
    (acc, garment) => {
      const clientName = garment.client_name || 'Unknown Client';
      if (!acc[clientName]) acc[clientName] = [] as T[];
      acc[clientName].push(garment as T);
      return acc;
    },
    {} as Record<string, T[]>
  );

  const sortedClientNames = Object.keys(groups).sort((a, b) =>
    order === 'asc' ? a.localeCompare(b) : b.localeCompare(a)
  );

  return { groups, sortedClientNames };
}
