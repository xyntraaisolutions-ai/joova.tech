"use client";

import { Input } from "@/components/ui/input";
import { dimensionUnitLabel, fromGrams, fromMillimeters, toGrams, toMillimeters, weightUnitLabel, weightUnits, type DimensionUnit, type MeasureSystem, type WeightUnit } from "@/lib/shipping/measure";

export function SizeWeightFields({
  system,
  weightUnit,
  dimensionUnit,
  weight,
  length,
  width,
  height,
  onSystem,
  onWeightUnit,
  onWeight,
  onLength,
  onWidth,
  onHeight,
}: {
  system: MeasureSystem;
  weightUnit: WeightUnit;
  dimensionUnit: DimensionUnit;
  weight: string;
  length: string;
  width: string;
  height: string;
  onSystem: (system: MeasureSystem) => void;
  onWeightUnit: (unit: WeightUnit) => void;
  onWeight: (value: string) => void;
  onLength: (value: string) => void;
  onWidth: (value: string) => void;
  onHeight: (value: string) => void;
}) {
  const grams = toGrams(weight, weightUnit);
  const lengthMm = toMillimeters(length, dimensionUnit);
  const widthMm = toMillimeters(width, dimensionUnit);
  const heightMm = toMillimeters(height, dimensionUnit);
  const ready = grams !== null && lengthMm !== null && widthMm !== null && heightMm !== null;
  return (
    <div className="mt-4">
      <p className="max-w-2xl text-sm text-muted">
        Factory product box. Leave these empty until the packed size and weight are confirmed. The United States standard is pounds and inches. These values are kept for delivery charge calculations.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-sm">
          Measuring standard
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
            value={system}
            onChange={(event) => onSystem(event.target.value === "metric" ? "metric" : "us")}
          >
            <option value="us">United States, pounds and inches</option>
            <option value="metric">Metric, kilograms and centimeters</option>
          </select>
        </label>
        <label className="text-sm">
          Weight unit
          <select
            className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
            value={weightUnit}
            onChange={(event) => onWeightUnit(event.target.value as WeightUnit)}
          >
            {weightUnits(system).map((unit) => <option key={unit} value={unit}>{weightUnitLabel[unit]}</option>)}
          </select>
        </label>
        <label className="text-sm">
          Weight
          <Input className="mt-2" data-field="boxWeight" inputMode="decimal" value={weight} onChange={(event) => onWeight(event.target.value)} />
        </label>
        <p className="self-end text-sm text-muted">{dimensionUnitLabel[dimensionUnit]} for length, width, and height.</p>
        <label className="text-sm">
          Length
          <Input className="mt-2" data-field="boxLength" inputMode="decimal" value={length} onChange={(event) => onLength(event.target.value)} />
        </label>
        <label className="text-sm">
          Width
          <Input className="mt-2" inputMode="decimal" value={width} onChange={(event) => onWidth(event.target.value)} />
        </label>
        <label className="text-sm">
          Height
          <Input className="mt-2" inputMode="decimal" value={height} onChange={(event) => onHeight(event.target.value)} />
        </label>
      </div>
      {ready ? (
        <p className="mt-4 text-sm text-muted">
          Carrier rates use {fromGrams(grams, "lb")} lb and {fromMillimeters(lengthMm, "in")} × {fromMillimeters(widthMm, "in")} × {fromMillimeters(heightMm, "in")} in.
        </p>
      ) : null}
    </div>
  );
}
