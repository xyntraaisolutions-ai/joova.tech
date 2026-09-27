import type { Metadata } from "next";
import { BandProduct } from "@/components/product/band-product";
import { PRICE, SITE_URL } from "@/content/site";

export const metadata: Metadata = {
  title: "Joova Band",
  description:
    "Pre-order Joova Band for $49.99. Screenless fitness tracker. No subscription. Ever.",
};

const productLd = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Joova Band",
  description: "Screenless fitness tracker with three straps in every box.",
  brand: { "@type": "Brand", name: "Joova" },
  offers: {
    "@type": "Offer",
    priceCurrency: "USD",
    price: PRICE,
    availability: "https://schema.org/PreOrder",
    url: `${SITE_URL}/band`,
  },
};

export default function BandPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productLd) }}
      />
      <BandProduct />
    </>
  );
}
