import type { Metadata } from "next";
import { Suspense } from "react";
import { CheckoutComplete } from "@/components/shop/checkout-complete";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Container className="max-w-xl py-10 md:py-16">
      <Suspense fallback={<p className="text-muted">Confirming your payment.</p>}>
        <CheckoutComplete />
      </Suspense>
    </Container>
  );
}
