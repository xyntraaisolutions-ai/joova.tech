import type { Metadata } from "next";
import { RingProduct } from "@/components/product/ring-product";
import { RING_PRICE, ringPriceLabel, SITE_URL } from "@/content/site";

export const metadata: Metadata = {
  title: "Smart Ring",
  description: `Joova Smart Ring, ${ringPriceLabel}. Five finishes: Midnight, Silver, Gold, Rose, and Graphite. Sleep, activity, and heart-rate trends. No subscription. Ever.`,
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Joova Smart Ring",
  description:
    "Screenless smart ring in five finishes. Sleep, activity, and heart-rate trends. No subscription.",
  brand: { "@type": "Brand", name: "Joova" },
  url: `${SITE_URL}/ring`,
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: RING_PRICE,
    availability: "https://schema.org/PreOrder",
    url: `${SITE_URL}/ring`,
  },
};

export default function RingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <RingProduct />
    </>
  );
}
