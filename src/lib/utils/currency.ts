export const formatAsCurrency = (value: string | number): string => {
  const numericValue = value.toString().replace(/[^0-9.]/g, '');
  const parts = numericValue.split('.');

  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  if (parts[1]) {
    parts[1] = parts[1].slice(0, 2); // Limit to 2 decimal places
  }

  return parts.join('.');
};

export const parseFloatFromCurrency = (value: string | number): number => {
  return parseFloat(value.toString().replace(/[^0-9.]/g, '')) || 0;
};

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const formatUnitPrice = (
  displayUnitPrice: string,
  setDisplayUnitPrice: (value: string) => void,
  setNewService: (fn: (prev: any) => any) => void
) => {
  const numericValue = parseFloatFromCurrency(displayUnitPrice);
  const formatted = numericValue.toFixed(2);

  setDisplayUnitPrice(formatAsCurrency(formatted));
  setNewService((prev: any) => ({ ...prev, unit_price: numericValue }));
};

// Convert dollars to cents
export const dollarsToCents = (dollars: number): number => {
  return Math.round(dollars * 100);
};

// Convert cents to dollars
export const centsToDollars = (cents: number): number => {
  return cents / 100;
};

// Format cents as currency string
export const formatCentsAsCurrency = (cents: number): string => {
  return formatCurrency(centsToDollars(cents));
};
