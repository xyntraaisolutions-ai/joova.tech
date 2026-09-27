import type { Metadata } from "next";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Warranty",
  description:
    "Lifetime warranty on Joova straps. 2-year warranty on the tracker, plus a free third year when you register in the app.",
};

export default function WarrantyPage() {
  return (
    <Container className="max-w-3xl py-16">
      <p className="text-sm text-muted">Effective date: draft — lawyer review pending</p>
      <h1
        className="font-display mt-3 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Warranty
      </h1>
      <div className="mt-8 space-y-6 text-muted">
        <p>
          Straps: lifetime warranty against manufacturing defects. Tracker:
          2 years, plus a free third year when you register in the Joova app.
        </p>
        <h2 className="font-display text-2xl font-extrabold text-ink">
          How to claim in 3 steps
        </h2>
        <ol className="list-decimal space-y-2 pl-5">
          <li>Email hello@joova.tech with your order number and photos.</li>
          <li>We confirm coverage and ship a replacement first when we can.</li>
          <li>Send the original back in the prepaid label we provide.</li>
        </ol>
        <p>
          Who pays shipping, what is excluded, and full terms will be finalized
          after legal review. [CONFIRM]
        </p>
      </div>
    </Container>
  );
}
