import type { Metadata } from "next";
import { support } from "@/content/site";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Privacy",
  description: "Joova privacy policy covering health-related data and CCPA/CPRA rights.",
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <p className="text-sm text-muted">Draft. Lawyer review required before launch.</p>
      <h1
        className="font-display mt-3 font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Privacy
      </h1>
      <div className="mt-8 space-y-4 text-muted">
        <p>
          We collect account, device, and wellness data to run the Joova app
          and fill orders. We do not sell personal information.
        </p>
        <p>
          Health-related data is stored in the US. California residents can
          request access or deletion under CCPA/CPRA.
        </p>
        <p>
          Contact {support.email}. Full cookie policy and pixel rules will be
          added with the consent banner.
        </p>
      </div>
    </Container>
  );
}
