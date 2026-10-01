import type { Metadata } from "next";
import { Suspense } from "react";
import { ResetPassword } from "@/components/account/reset-password";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Reset password",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage() {
  return (
    <Container className="py-10 md:py-16">
      <Suspense fallback={<p className="text-muted">Checking your reset link.</p>}>
        <ResetPassword />
      </Suspense>
    </Container>
  );
}
