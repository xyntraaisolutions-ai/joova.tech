import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { company, support } from "@/content/site";

export const metadata: Metadata = {
  title: "Privacy",
  description: `Privacy policy for ${company.legalName}. We use account and order information to run joova.tech and Joova products. We do not sell personal information.`,
};

export default function PrivacyPage() {
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display" style={{ fontSize: "var(--text-h1)" }}>
        Privacy
      </h1>
      <p className="mt-4 text-lg text-muted">
        This policy covers joova.tech and Joova products from {company.legalName},{" "}
        {company.address}.
      </p>
      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="font-display text-2xl text-ink">What we collect</h2>
          <p className="mt-3">
            We collect the information you give us to create a Joova Customer
            Account, place an order, register a product, or contact support.
            That includes your name, email, order details, and the messages you
            send us.
          </p>
          <p className="mt-3">
            When you use a Joova product, we collect the information needed to
            run that product and, where it applies, the Joova app. We use this
            information to fill orders, provide support, and operate the
            products you buy.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">What we do not do</h2>
          <p className="mt-3">We do not sell personal information.</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Cookies</h2>
          <p className="mt-3">
            A full cookie policy and pixel rules will be added with the consent
            banner.
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Contact</h2>
          <p className="mt-3">
            Questions about this policy go to{" "}
            <a className="font-medium text-ink underline" href={`mailto:${support.email}`}>
              {support.email}
            </a>
            . {company.supportHours}
          </p>
        </section>
      </div>
    </Container>
  );
}
