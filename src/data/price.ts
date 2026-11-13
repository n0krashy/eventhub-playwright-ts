// The app shows prices as text, for example "$1,500".
// These two helpers convert between that text and a number.

export function parsePrice(text: string): number {
  return Number(text.replace('$', '').replaceAll(',', ''));
}

export function formatPrice(amount: number): string {
  return `$${amount.toLocaleString('en-US')}`;
}
