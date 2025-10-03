export const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);

export const calculateHoldTime = (inDate: string, soldDate: string): number | undefined => {
  if (!inDate || !soldDate) return undefined;

  const start = new Date(inDate).getTime();
  const end = new Date(soldDate).getTime();

  if (end > start) {
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  }

  return undefined;
};

export const calculateNetProfit = (watch: {
  priceSold?: number;
  purchasePrice?: number;
  accessoriesCost?: number;
  fees?: number;
  shipping?: number;
  taxes?: number;
}): number => {
  const totalIn = (watch.purchasePrice || 0) + (watch.accessoriesCost || 0);
  return (watch.priceSold || 0) - totalIn - (watch.fees || 0) - (watch.shipping || 0) - (watch.taxes || 0);
};
