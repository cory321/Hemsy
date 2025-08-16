import SERVICE_UNIT_TYPES, { ServiceUnitType } from './serviceUnitTypes';

export function pluralizeUnit(unit: ServiceUnitType, quantity: number): string {
  if (quantity === 1) {
    return unit;
  }

  switch (unit) {
    case SERVICE_UNIT_TYPES.ITEM:
      return 'items';
    case SERVICE_UNIT_TYPES.HOUR:
      return 'hours';
    case SERVICE_UNIT_TYPES.DAY:
      return 'days';
    default:
      return unit;
  }
}
