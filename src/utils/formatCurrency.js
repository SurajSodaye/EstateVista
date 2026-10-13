/**
 * Indian Rupee and Area formatting utilities
 */

/**
 * Format a number as Indian Rupee (INR)
 * @param {number} amount
 * @param {boolean} compact - whether to show as e.g. "₹2.5 Cr", "₹75 L", "₹45 K"
 * @returns {string}
 */
export function formatCurrency(amount, compact = false) {
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '₹0';
  }

  const num = Number(amount);

  if (compact) {
    if (num >= 10000000) {
      const cr = num / 10000000;
      return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
    }
    if (num >= 100000) {
      const lakh = num / 100000;
      return `₹${lakh % 1 === 0 ? lakh.toFixed(0) : lakh.toFixed(2)} L`;
    }
    if (num >= 1000) {
      const k = num / 1000;
      return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(1)} K`;
    }
  }

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(num);
}

/**
 * Format square footage / area
 * @param {number} sqft
 * @returns {string}
 */
export function formatArea(sqft) {
  if (!sqft) return '0 sq.ft.';
  const formatted = new Intl.NumberFormat('en-IN').format(sqft);
  return `${formatted} sq.ft.`;
}
