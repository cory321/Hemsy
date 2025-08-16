export const formatAsCurrency = (value: string | number): string => {
  // Remove all non-numeric characters except periods
  let numericValue = value.toString().replace(/[^0-9.]/g, '');

  // If there are multiple periods, keep only the first one
  const firstPeriodIndex = numericValue.indexOf('.');
  if (firstPeriodIndex !== -1) {
    numericValue =
      numericValue.substring(0, firstPeriodIndex + 1) +
      numericValue.substring(firstPeriodIndex + 1).replace(/\./g, '');
  }

  // Add leading zero if string starts with period
  if (numericValue.startsWith('.')) {
    numericValue = '0' + numericValue;
  }

  const parts = numericValue.split('.');

  if (parts[0]) {
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  } else if (parts.length > 1) {
    // If there's no whole number part but there is a decimal, add zero
    parts[0] = '0';
  }

  if (parts[1]) {
    parts[1] = parts[1].slice(0, 2); // Limit to 2 decimal places
  }

  return parts.join('.');
};

export const parseFloatFromCurrency = (value: string | number): number => {
  // Remove all non-numeric characters except periods
  let numericValue = value.toString().replace(/[^0-9.]/g, '');

  // If there are multiple periods, keep only the first one
  const firstPeriodIndex = numericValue.indexOf('.');
  if (firstPeriodIndex !== -1) {
    numericValue =
      numericValue.substring(0, firstPeriodIndex + 1) +
      numericValue.substring(firstPeriodIndex + 1).replace(/\./g, '');
  }

  return parseFloat(numericValue) || 0;
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
