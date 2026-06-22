// Format a number as GBP currency (£)
export const formatCurrency = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount) || 0;
  }
  return `£${amount.toFixed(2)}`;
};
