import type { Metadata } from "next";
import { WishlistList } from "@/components/shop/wishlist-list";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Wishlist",
  description: "Products you saved on this device. Open a product to add it to your cart.",
};

export default function WishlistPage() {
  return (
    <Container className="py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Wishlist
      </h1>
      <p className="mt-4 max-w-2xl text-lg text-muted">
        Saved on this device. Every product can be added to the cart from its page.
      </p>
      <WishlistList />
    </Container>
  );
}
