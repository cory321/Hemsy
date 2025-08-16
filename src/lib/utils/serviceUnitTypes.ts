export const SERVICE_UNIT_TYPES = {
  ITEM: 'item',
  HOUR: 'hour',
  DAY: 'day',
} as const;

export type ServiceUnitType =
  (typeof SERVICE_UNIT_TYPES)[keyof typeof SERVICE_UNIT_TYPES];

export default SERVICE_UNIT_TYPES;
