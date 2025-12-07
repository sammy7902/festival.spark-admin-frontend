/**
 * Currency Utilities
 * Converts between decimal representation and smallest unit (paise/cents)
 */

/**
 * Convert decimal amount to smallest unit (paise)
 */
export const toSmallestUnit = (amount: number | string): number => {
  if (amount === null || amount === undefined || amount === '') {
    throw new Error('Amount cannot be null, undefined, or empty');
  }

  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numAmount)) {
    throw new Error(`Invalid amount: ${amount}`);
  }

  if (numAmount < 0) {
    throw new Error(`Amount cannot be negative: ${amount}`);
  }

  return Math.round(numAmount * 100);
};

/**
 * Convert smallest unit to decimal string
 */
export const fromSmallestUnit = (smallestUnit: number): string => {
  if (smallestUnit === null || smallestUnit === undefined) {
    throw new Error('Smallest unit cannot be null or undefined');
  }

  const num = typeof smallestUnit === 'string' ? parseInt(smallestUnit, 10) : smallestUnit;

  if (isNaN(num)) {
    throw new Error(`Invalid smallest unit: ${smallestUnit}`);
  }

  return (num / 100).toFixed(2);
};

/**
 * Format smallest unit as currency string
 */
export const formatCurrency = (smallestUnit: number, symbol = '₹'): string => {
  return `${symbol}${fromSmallestUnit(smallestUnit)}`;
};

/**
 * Validate amount
 */
export const isValidAmount = (amount: number | string): boolean => {
  try {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return !isNaN(num) && num >= 0;
  } catch {
    return false;
  }
};

