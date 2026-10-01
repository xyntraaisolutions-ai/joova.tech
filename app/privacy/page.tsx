import type { Metadata } from "next";
import { LastUpdated } from "@/components/content/last-updated";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { company } = await loadContentBundle();
  return {
    title: "Privacy",
    description: `Privacy policy for ${company.legalName}. We use account and order information to run joova.tech and Joova products. We do not sell personal information.`,
  };
}

export default async function PrivacyPage() {
  const { company, support, pageCopy } = await loadContentBundle();
  const privacy = pageCopy.privacy;
  return (
    <Container className="max-w-3xl py-10 md:py-16">
      <h1 className="font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
        Privacy
      </h1>
      <LastUpdated value={privacy.updatedOn} />
      <p className="mt-4 text-lg text-muted">
        This policy covers joova.tech and Joova products from {company.legalName},{" "}
        {company.address}.
      </p>
      <div className="mt-8 space-y-8 text-muted">
        <section>
          <h2 className="font-display text-2xl text-ink">What we collect</h2>
          <p className="mt-3">
            {privacy.collectAccount}
          </p>
          <p className="mt-3">
            {privacy.collectProduct}
          </p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">What we do not do</h2>
          <p className="mt-3">{privacy.sell}</p>
        </section>
        <section>
          <h2 className="font-display text-2xl text-ink">Cookies</h2>
          <p className="mt-3">
            {privacy.cookies}
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
