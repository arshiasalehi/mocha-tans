export type OrderLineInput = {
  quantity: number;
  unit_price_cents: number;
};

export function calculateSubtotalCents(lines: OrderLineInput[]): number {
  return lines.reduce((sum, line) => sum + line.quantity * line.unit_price_cents, 0);
}

export function calculateTaxCents(subtotalCents: number, rateBps: number): number {
  return Math.round((subtotalCents * rateBps) / 10_000);
}

export function calculateOrderTotalCents(params: {
  lines: OrderLineInput[];
  combinedTaxRateBps?: number;
}) {
  const subtotal = calculateSubtotalCents(params.lines);
  const tax = calculateTaxCents(subtotal, params.combinedTaxRateBps ?? 0);
  return {
    subtotal_cents: subtotal,
    tax_cents: tax,
    total_cents: subtotal + tax,
  };
}
