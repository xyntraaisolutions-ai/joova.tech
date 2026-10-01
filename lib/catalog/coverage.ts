export type ProductCoverageInput = {
  warrantyEligible?: boolean;
  warrantyYears?: number | null;
  warrantyDays?: number | null;
  freeShipping?: unknown;
  returnDays?: unknown;
};

export type ProductCoverage = {
  warranty: string;
  shipping: string;
  returns: string;
};

function yearsLabel(years: number) {
  return years === 1 ? "1 year" : `${years} years`;
}

function returnDays(value: unknown) {
  if (value === undefined || value === null || value === "") return 30;
  const days = Number(value);
  return Number.isFinite(days) ? days : 30;
}

export function productCoverage(input: ProductCoverageInput): ProductCoverage {
  const years = Number(input.warrantyYears ?? 0);
  const days = Number(input.warrantyDays ?? 0);
  let warranty = "This product is not covered by the Joova limited warranty.";
  if (input.warrantyEligible) {
    if (years > 0) {
      warranty = `${yearsLabel(years)} limited warranty from the purchase date. Register within 30 days for 1 extra year.`;
    } else if (days > 0) {
      warranty = `${days}-day coverage from the purchase date.`;
    } else {
      warranty = "Covered by the Joova limited warranty from the purchase date.";
    }
  }
  const shipping = input.freeShipping === false || input.freeShipping === "false"
    ? "Shipping is charged at checkout."
    : "Free shipping in the United States.";
  const window = returnDays(input.returnDays);
  const returns = window > 0
    ? `Free returns for ${window} days from delivery.`
    : "This product is not in the free return window.";
  return { warranty, shipping, returns };
}

export function coverageFromCatalog(product: { id?: string; name?: string; coverage?: ProductCoverage | null }): ProductCoverage {
  if (product.coverage) return product.coverage;
  const strap = /strap/i.test(product.id ?? "") || /strap/i.test(product.name ?? "");
  return productCoverage({
    warrantyEligible: true,
    warrantyYears: strap ? null : 1,
    warrantyDays: strap ? 90 : null,
    freeShipping: true,
    returnDays: 30,
  });
}

export function coverageList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((line): line is string => typeof line === "string" && line.trim().length > 0);
}
