const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
});

/** Formats a USD price: whole amounts drop the cents (`$5,500`), others keep two decimals (`$4,500.50`). */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}
