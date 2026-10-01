"use client";

import { useSiteContent } from "@/components/layout/site-content";
import { coverageFromCatalog, type ProductCoverage } from "@/lib/catalog/coverage";

export function CoverageLines({ coverage }: { coverage: ProductCoverage }) {
  return (
    <ul className="mt-2 space-y-1 text-sm text-muted">
      <li>Warranty: {coverage.warranty}</li>
      <li>Shipping: {coverage.shipping}</li>
      <li>Returns: {coverage.returns}</li>
    </ul>
  );
}

export function useProductCoverage(productId?: string, name?: string) {
  const { catalog } = useSiteContent();
  const product = catalog.find((item) => item.id === productId);
  return coverageFromCatalog({ id: productId, name: product?.name || name, coverage: product?.coverage });
}
