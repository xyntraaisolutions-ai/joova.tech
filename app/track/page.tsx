import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Track my order",
  description: "Track a Joova order. Tracking goes live after the first shipments.",
};

export default function TrackPage() {
  return (
    <Container className="max-w-xl py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Track my order
      </h1>
      <p className="mt-4 text-muted">
        Tracking will use AfterShip or Shopify order status after orders ship.
        Lookups are not live yet.
      </p>
      <form className="mt-8 space-y-4" action="#">
        <label className="block">
          <span className="text-sm text-muted">Order number</span>
          <Input className="mt-2" name="order" autoComplete="off" />
        </label>
        <label className="block">
          <span className="text-sm text-muted">Email</span>
          <Input className="mt-2" type="email" name="email" />
        </label>
        <Button type="submit" disabled>
          Look up (coming soon)
        </Button>
      </form>
    </Container>
  );
}
