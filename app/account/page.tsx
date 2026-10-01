import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthPanel } from "@/components/account/auth-panel";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { policies } = await loadContentBundle();
  return {
    title: "Joova Customer Account",
    description: policies.accountSummary,
  };
}

export default async function AccountPage() {
  const { policies } = await loadContentBundle();
  return (
    <Container className="py-10 md:py-16">
      <Suspense fallback={<p className="text-muted">Loading your account.</p>}>
        <AuthPanel summary={policies.accountSummary} warranty={policies.warrantyRegistration} />
      </Suspense>
    </Container>
  );
}
