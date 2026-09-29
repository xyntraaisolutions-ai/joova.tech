import type { Metadata } from "next";
import { DealList } from "@/components/shop/deal-list";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Deals",
  description:
    "Current Joova offers: extra woven straps in five colors.",
};

export default function DealsPage() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Deals
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Extra woven straps. Every product is available now. Checkout does not take a card on this site yet.
      </p>
      <div className="mt-10">
        <DealList />
      </div>
    </Container>
  );
}
