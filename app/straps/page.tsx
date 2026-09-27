import type { Metadata } from "next";
import { StrapShop } from "@/components/product/strap-shop";
import { policies, strapPriceLabel } from "@/content/site";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Straps",
  description: `Buy a Joova woven strap on its own for ${strapPriceLabel} each. Five colors. No tracker included.`,
};

export default function StrapsPage() {
  return (
    <Container className="py-10 md:py-16">
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral-ink">
        Straps only
      </p>
      <h1
        className="font-display mt-3 font-semibold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        A strap, without the band.
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every Joova Band box includes the strap you wear plus one extra. You
        can also buy woven straps on their own for {strapPriceLabel} each.
        Pick a color and quantity. The tracker and charger stay with the band.{" "}
        {policies.strapSummary}
      </p>
      <StrapShop />
    </Container>
  );
}
