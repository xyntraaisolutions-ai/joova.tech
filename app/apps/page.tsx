import type { Metadata } from "next";
import Link from "next/link";
import { isExternalHref, storeTarget } from "@/content/apps";
import { StoreBadge } from "@/components/apps/store-badge";
import { PhoneMockup } from "@/components/media/phone-mockup";
import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function generateMetadata(): Promise<Metadata> {
  const { apps } = await loadContentBundle();
  return {
    title: "Apps",
    description: apps.lead,
  };
}

export default async function AppsPage() {
  const { apps } = await loadContentBundle();
  return (
    <Container className="py-10 md:py-16">
      <div className="grid items-center gap-10 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
        <div>
          <p className="text-sm font-bold tracking-wide text-muted">{apps.kicker}</p>
          <h1 className="mt-2 max-w-3xl font-display font-extrabold" style={{ fontSize: "var(--text-h1)" }}>
            {apps.title}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted">{apps.lead}</p>
        </div>
        <PhoneMockup dark title={apps.phoneTitle} copy={apps.phoneCopy} />
      </div>

      {apps.notes.length ? (
        <ul className="mt-12 grid gap-3 sm:grid-cols-3">
          {apps.notes.map((note) => (
            <li key={note.id} className="rounded-3xl bg-white p-5">
              <h2 className="font-bold">{note.title}</h2>
              <p className="mt-2 text-sm text-muted">{note.body}</p>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {apps.cards.map((card) => (
          <section key={card.id} className="flex flex-col rounded-[2rem] border border-stone bg-white p-6 md:p-8">
            <p className="text-sm font-bold text-coral-ink">{card.eyebrow}</p>
            <h2 className="mt-2 font-display text-3xl md:text-4xl">{card.title}</h2>
            <p className="mt-3 max-w-md text-muted">{card.lead}</p>
            <ol className="mt-8 space-y-4">
              {card.steps.map((step, index) => (
                <li key={`${card.id}-${index}`} className="grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3">
                  <span className="flex size-8 items-center justify-center rounded-full bg-stone text-sm font-bold">{index + 1}</span>
                  <span className="pt-1">{step}</span>
                </li>
              ))}
            </ol>
            {card.stores.length ? (
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {card.stores.map((store) => (
                  <StoreBadge
                    key={store.id}
                    store={store.store}
                    name={card.title}
                    kicker={store.kicker}
                    label={store.label}
                    iconUrl={store.iconUrl}
                    href={storeTarget(card.id, store)}
                    className="w-full sm:w-auto"
                  />
                ))}
              </div>
            ) : null}
            <p className="mt-6 text-sm">
              <TextLink href={card.href}>{card.hrefLabel}</TextLink>
            </p>
          </section>
        ))}
      </div>

      <p className="mt-8 max-w-2xl text-sm text-muted">
        {apps.note}{" "}
        <TextLink href={apps.includesHref}>{apps.includesLabel}</TextLink>.{" "}
        <TextLink href={apps.privacyHref}>{apps.privacyLabel}</TextLink>.
      </p>
    </Container>
  );
}

function TextLink({ href, children }: { href: string; children: string }) {
  const className = "font-bold text-ink underline underline-offset-4";
  if (isExternalHref(href)) {
    return (
      <a href={href} className={className} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
