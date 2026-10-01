import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutReview } from "@/components/shop/checkout-review";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Checkout",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>Checkout</h1>
      <p className="mt-3 max-w-2xl text-muted">Check the ship-to address and order. Pay opens Stripe. You can come back and edit if you do not finish.</p>
      <div className="mt-8">
        <Suspense fallback={<p className="text-muted">Loading checkout.</p>}>
          <CheckoutReview />
        </Suspense>
      </div>
    </Container>
  );
}
