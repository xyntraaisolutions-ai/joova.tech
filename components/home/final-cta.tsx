import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import { bandImageSize, priceLabel } from "@/content/site";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export function FinalCTA() {
  return (
    <Section className="pb-24">
      <Container className="cinematic grid items-center gap-10 rounded-[28px] px-6 py-12 sm:px-12 lg:grid-cols-2">
        <div>
          <h2
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Pre-order Joova Band
          </h2>
          <p className="mt-4 text-paper/80">{priceLabel}. No subscription. Ever.</p>
          <Link href="/band" className={`${buttonClassName("dark")} mt-8`}>
            Pre-order now
          </Link>
        </div>
        <div className="stage flex justify-center rounded-[24px] p-6">
          <ProductTurntable>
            <BandPhoto
              src="/bands/band-black.png"
              alt="Joova Band in Black"
              width={bandImageSize.width}
              height={bandImageSize.height}
              className="h-auto max-h-[420px] w-auto"
            />
          </ProductTurntable>
        </div>
      </Container>
    </Section>
  );
}
