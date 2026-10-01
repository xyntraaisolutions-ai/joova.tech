import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackPage } from "@/components/track/track-page";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Track my order",
  description: "See a Joova order, its status, and tracking. Sign in, or look it up with the order number and email.",
};

export default function TrackRoute() {
  return (
    <Container className="max-w-xl py-10 md:py-16">
      <Suspense fallback={<p className="text-muted">Loading tracking.</p>}>
        <TrackPage />
      </Suspense>
    </Container>
  );
}
