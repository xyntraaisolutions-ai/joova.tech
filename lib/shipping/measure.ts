const GRAMS = { lb: 453.59237, oz: 28.349523125, kg: 1000, g: 1 } as const;
const MILLIMETERS = { in: 25.4, cm: 10 } as const;

export type MeasureSystem = "us" | "metric";
export type WeightUnit = keyof typeof GRAMS;
export type DimensionUnit = keyof typeof MILLIMETERS;

export const weightUnitLabel: Record<WeightUnit, string> = {
  lb: "Pounds",
  oz: "Ounces",
  kg: "Kilograms",
  g: "Grams",
};

export const dimensionUnitLabel: Record<DimensionUnit, string> = {
  in: "Inches",
  cm: "Centimeters",
};

export function weightUnits(system: MeasureSystem): WeightUnit[] {
  return system === "us" ? ["lb", "oz"] : ["kg", "g"];
}

export function defaultWeightUnit(system: MeasureSystem): WeightUnit {
  return system === "us" ? "lb" : "kg";
}

export function defaultDimensionUnit(system: MeasureSystem): DimensionUnit {
  return system === "us" ? "in" : "cm";
}

export function isWeightUnit(value: unknown): value is WeightUnit {
  return value === "lb" || value === "oz" || value === "kg" || value === "g";
}

export function isDimensionUnit(value: unknown): value is DimensionUnit {
  return value === "in" || value === "cm";
}

function formatMeasure(value: number) {
  const text = value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
  return text || "0";
}

export function toGrams(value: string, unit: WeightUnit) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * GRAMS[unit] * 1000) / 1000;
}

export function fromGrams(grams: number, unit: WeightUnit) {
  return formatMeasure(grams / GRAMS[unit]);
}

export function toMillimeters(value: string, unit: DimensionUnit) {
  if (!value.trim()) return null;
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * MILLIMETERS[unit] * 1000) / 1000;
}

export function fromMillimeters(mm: number, unit: DimensionUnit) {
  return formatMeasure(mm / MILLIMETERS[unit]);
}

function storedNumber(value: unknown) {
  const amount = typeof value === "number" ? value : Number(value);
  return Number.isFinite(amount) && amount > 0 ? amount : null;
}

export function boxDraft(commerce?: Record<string, unknown>) {
  const boxSystem: MeasureSystem = commerce?.boxSystem === "metric" ? "metric" : "us";
  const allowedWeight = weightUnits(boxSystem);
  const weightUnit = isWeightUnit(commerce?.weightUnit) && allowedWeight.includes(commerce.weightUnit)
    ? commerce.weightUnit
    : defaultWeightUnit(boxSystem);
  const dimensionUnit = isDimensionUnit(commerce?.dimensionUnit)
    && ((boxSystem === "us" && commerce.dimensionUnit === "in") || (boxSystem === "metric" && commerce.dimensionUnit === "cm"))
    ? commerce.dimensionUnit
    : defaultDimensionUnit(boxSystem);
  const grams = storedNumber(commerce?.weightGrams);
  const length = storedNumber(commerce?.lengthMm);
  const width = storedNumber(commerce?.widthMm);
  const height = storedNumber(commerce?.heightMm);
  return {
    boxSystem,
    weightUnit,
    dimensionUnit,
    boxWeight: grams ? fromGrams(grams, weightUnit) : "",
    boxLength: length ? fromMillimeters(length, dimensionUnit) : "",
    boxWidth: width ? fromMillimeters(width, dimensionUnit) : "",
    boxHeight: height ? fromMillimeters(height, dimensionUnit) : "",
  };
}
