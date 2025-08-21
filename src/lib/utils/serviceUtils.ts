import {
  formatCentsAsCurrency,
  dollarsToCents,
  centsToDollars,
} from './currency';
import { pluralizeUnit } from './unitUtils';
import { ServiceUnitType } from './serviceUnitTypes';

export interface Service {
  id?: string;
  name: string;
  description?: string | null;
  default_qty: number;
  default_unit: ServiceUnitType;
  default_unit_price_cents: number;
  frequently_used?: boolean;
  frequently_used_position?: number | null;
}

export interface ServiceFormData {
  name: string;
  description: string;
  qty: number;
  unit: ServiceUnitType;
  unit_price: number;
  frequently_used?: boolean;
  frequently_used_position?: number | null;
}

export const handleChange = (
  e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  setService: React.Dispatch<React.SetStateAction<ServiceFormData>>
) => {
  const { name, value } = e.target;

  if (name === 'qty') {
    const numValue = parseInt(value, 10) || 0;
    setService((prev) => ({ ...prev, [name]: numValue }));
  } else {
    setService((prev) => ({ ...prev, [name]: value }));
  }
};

export const handleUnitPriceBlur = (
  service: ServiceFormData,
  setService: React.Dispatch<React.SetStateAction<ServiceFormData>>
) => {
  const formattedPrice = parseFloat(service.unit_price.toString()).toFixed(2);
  setService((prev) => ({ ...prev, unit_price: parseFloat(formattedPrice) }));
};

export const calculateTotalPrice = (service: {
  qty?: number;
  unit_price?: number;
  default_qty?: number;
  default_unit_price_cents?: number;
}): string => {
  // Handle both form data and database service objects
  if ('qty' in service && 'unit_price' in service) {
    // Form data with dollars
    const quantity = service.qty || 0;
    const unitPrice = service.unit_price || 0;
    const total = quantity * unitPrice;
    return `$${total.toFixed(2)}`;
  } else if (
    'default_qty' in service &&
    'default_unit_price_cents' in service
  ) {
    // Database service with cents
    const quantity = service.default_qty || 0;
    const totalCents = quantity * (service.default_unit_price_cents || 0);
    return formatCentsAsCurrency(totalCents);
  }

  return '$0.00';
};

export const convertServiceForForm = (service: Service): ServiceFormData => {
  const result: ServiceFormData = {
    name: service.name,
    description: service.description || '',
    qty: service.default_qty,
    unit: service.default_unit,
    unit_price: centsToDollars(service.default_unit_price_cents),
  };

  if (service.frequently_used !== undefined) {
    result.frequently_used = service.frequently_used;
  }

  if (service.frequently_used_position !== undefined) {
    result.frequently_used_position = service.frequently_used_position;
  }

  return result;
};

export const convertServiceForDatabase = (
  formData: ServiceFormData
): Partial<Service> => {
  const result: Partial<Service> = {
    name: formData.name,
    default_qty: formData.qty,
    default_unit: formData.unit,
    default_unit_price_cents: dollarsToCents(formData.unit_price),
  };

  if (formData.description) {
    result.description = formData.description;
  }

  if (formData.frequently_used !== undefined) {
    result.frequently_used = formData.frequently_used;
  }

  if (formData.frequently_used_position !== undefined) {
    result.frequently_used_position = formData.frequently_used_position;
  }

  return result;
};
