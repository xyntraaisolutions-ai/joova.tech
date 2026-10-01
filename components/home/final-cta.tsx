import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import { bandImageSize } from "@/content/site";
import { loadContentBundle } from "@/lib/content/load";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function FinalCTA() {
  const { priceLabels } = await loadContentBundle();
  const priceLabel = priceLabels.band;
  return (
    <Section className="pb-24">
      <Container className="cinematic grid items-center gap-10 rounded-[28px] px-6 py-12 sm:px-12 lg:grid-cols-2">
        <div>
          <h2
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            Shop the Fitness Band
          </h2>
          <p className="mt-4 text-paper/80">{priceLabel}. Available now. No subscription needed. Ever.</p>
          <Link href="/band#buy" className={`${buttonClassName("dark")} mt-8`}>
            Shop now
          </Link>
        </div>
        <div className="stage flex justify-center rounded-[24px] p-6">
          <ProductTurntable>
            <BandPhoto
              src="/bands/joova-band-black-1600.png"
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
