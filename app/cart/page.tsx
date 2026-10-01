import type { Metadata } from "next";
import { CartPage } from "@/components/shop/cart-page";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default function Page() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>Cart</h1>
      <p className="mt-3 max-w-2xl text-muted">Change quantities here. You can still edit the ship-to address on the next page until you open Stripe.</p>
      <div className="mt-8">
        <CartPage />
      </div>
    </Container>
  );
}
