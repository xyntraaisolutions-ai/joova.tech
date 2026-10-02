import type { Metadata } from "next";
import { DealList } from "@/components/shop/deal-list";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Deals",
  description: "Current Joova offers.",
};

export default function DealsPage() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Deals
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Current offers. Stock status is shown on each product.
      </p>
      <div className="mt-10">
        <DealList />
      </div>
    </Container>
  );
}
