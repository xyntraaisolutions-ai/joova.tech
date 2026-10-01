export const carrierCodes = ["usps", "ups", "fedex"] as const;

export type CarrierCode = (typeof carrierCodes)[number];

export const carriers: { code: CarrierCode; name: string; services: string[] }[] = [
  { code: "usps", name: "USPS", services: ["Ground Advantage", "Priority Mail", "Priority Mail Express"] },
  { code: "ups", name: "UPS", services: ["Ground", "2nd Day Air", "Next Day Air"] },
  { code: "fedex", name: "FedEx", services: ["Ground", "2Day", "Standard Overnight"] },
];

export function isCarrierCode(value: string): value is CarrierCode {
  return carrierCodes.includes(value as CarrierCode);
}
