interface InvoiceItemCalculation {
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

export function calculateItemSubtotal(item: InvoiceItemCalculation): number {
  return item.quantity * item.unitPrice;
}

export function calculateItemTax(item: InvoiceItemCalculation): number {
  const subtotal = calculateItemSubtotal(item);
  return subtotal * item.taxRate;
}

export function calculateItemTotal(item: InvoiceItemCalculation): number {
  const subtotal = calculateItemSubtotal(item);
  const tax = calculateItemTax(item);
  return subtotal + tax;
}

export function calculateInvoiceTotals(items: InvoiceItemCalculation[]) {
  const subtotal = items.reduce((sum, item) => sum + calculateItemSubtotal(item), 0);
  const tax = items.reduce((sum, item) => sum + calculateItemTax(item), 0);
  const total = subtotal + tax;

  return {
    subtotal,
    tax,
    total,
  };
}

// Helper to get tax inclusive price (for display purposes)
export function getTaxInclusivePrice(unitPrice: number, taxRate: number): number {
  return unitPrice * (1 + taxRate);
}

// Format currency for display
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
} 