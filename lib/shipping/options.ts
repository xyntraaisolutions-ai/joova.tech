export const shippingCodes = ["free", "standard", "expedited"] as const;

export type ShippingCode = (typeof shippingCodes)[number];

export type ShippingOption = {
  code: ShippingCode;
  name: string;
  price: number;
  minDays: number;
  maxDays: number;
  enabled: boolean;
};

export function shippingWindow(option: { minDays: number; maxDays: number }) {
  if (option.minDays === option.maxDays) {
    return option.minDays === 1 ? "1 day" : `${option.minDays} days`;
  }
  return `${option.minDays} to ${option.maxDays} days`;
}

export function isShippingCode(value: string): value is ShippingCode {
  return shippingCodes.includes(value as ShippingCode);
}
