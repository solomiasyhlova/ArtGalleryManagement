const priceFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  trailingZeroDisplay: 'stripIfInteger',
});

const dateFormatter = new Intl.DateTimeFormat('en-US', { dateStyle: 'long' });

/** Formats a USD price: whole amounts drop the cents (`$5,500`), others keep two decimals (`$4,500.50`). */
export function formatPrice(value: number): string {
  return priceFormatter.format(value);
}

/** Formats an ISO timestamp as a date in the viewer's time zone (`March 5, 2026`). */
export function formatDate(iso: string): string {
  return dateFormatter.format(new Date(iso));
}
