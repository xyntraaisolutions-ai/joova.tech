import type { Metadata } from "next";
import Image from "next/image";
import {
  SHARE_PRICE,
  shareBuds,
  shareFacts,
  shareImageSize,
  sharePriceLabel,
  SITE_URL,
} from "@/content/site";
import { AddToCart } from "@/components/product/add-to-cart";
import { Badge } from "@/components/ui/badge";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export const metadata: Metadata = {
  title: "Joova Share Pod",
  description: `Joova Share Pod, ${sharePriceLabel}. Available now. Quad-audio sharing station with four pairs of wireless earbuds in one power case.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Joova Share Pod",
  description:
    "Quad-audio sharing station with four pairs of wireless earbuds in one power case. All eight buds can link to one device, or pairs can run on separate devices.",
  brand: { "@type": "Brand", name: "Joova" },
  image: `${SITE_URL}/electronics/joova-share.jpg`,
  url: `${SITE_URL}/share`,
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: SHARE_PRICE,
    availability: "https://schema.org/InStock",
    url: `${SITE_URL}/share`,
  },
};

export default function SharePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <Container className="grid gap-8 py-8 lg:grid-cols-2 md:gap-10 md:py-12">
        <div className="stage rounded-[24px] p-4 sm:p-6">
          <Image
            src="/electronics/joova-share.jpg"
            alt="Joova Share Pod case with four pairs of earbuds, and two people listening together from one tablet"
            width={shareImageSize.width}
            height={shareImageSize.height}
            priority
            className="h-auto w-full rounded-2xl"
            sizes="(min-width: 1024px) 560px, 100vw"
          />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
            Electronics
          </p>
          <h1
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h1)" }}
          >
            Joova Share Pod
          </h1>
          <p className="mt-3 text-2xl">{sharePriceLabel}</p>
          <p className="mt-2 text-lg">Quad-Audio Sharing Station</p>
          <Badge className="mt-4">Available now</Badge>
          <p className="mt-6 text-muted">
            An all-in-one portable audio center. Four full pairs of wireless
            earbuds, eight buds in total, live in one high-capacity power case
            with a digital LED battery display.
          </p>
          <p className="mt-3 text-muted">
            All eight earbuds can link to a single phone, tablet, or laptop at
            the same time for group listening. Pairs can also run on their own
            across separate devices.
          </p>
          <dl className="mt-8 divide-y divide-stone border-y border-stone">
            {shareFacts.map((fact) => (
              <div key={fact.label} className="grid gap-1 py-3 sm:grid-cols-[8rem_1fr]">
                <dt className="text-sm text-muted">{fact.label}</dt>
                <dd>{fact.value}</dd>
              </div>
            ))}
          </dl>
          <AddToCart id="share" name="Joova Share Pod" price={SHARE_PRICE} />
        </div>
      </Container>
      <Section className="bg-stone/40">
        <Container>
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-coral-ink">
            In the case
          </p>
          <h2
            className="font-display mt-3 font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Four pairs
          </h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {shareBuds.map((bud, index) => (
              <li key={bud.name} className="rounded-3xl border border-stone bg-white p-6">
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-coral-ink">
                  {index + 1}
                </p>
                <p className="font-display mt-3 text-2xl font-semibold">{bud.name}</p>
                <p className="mt-2 text-muted">{bud.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </Section>
    </>
  );
}
