export interface ShippingResult {
  cost: number;
  label: string;
}

export function calculateShipping(
  subtotal: number,
  shippingFee: number,
  freeShippingThreshold: number | null,
): ShippingResult {
  if (shippingFee <= 0) {
    return { cost: 0, label: "Ücretsiz Kargo" };
  }
  if (freeShippingThreshold !== null && subtotal >= freeShippingThreshold) {
    return { cost: 0, label: "Ücretsiz Kargo" };
  }
  return { cost: shippingFee, label: "Kargo" };
}
