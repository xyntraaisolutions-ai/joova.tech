import Image from "next/image";
import { bandLineupSize } from "@/content/site";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function ColorPicker() {
  return (
    <Section id="colors">
      <Container>
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
          Five colors
        </p>
        <h2
          className="font-display mt-3 font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Woven loop. Silver buckle. Black tracker.
        </h2>
        <p className="mt-4 max-w-2xl text-muted">
          Black, Blue, Green, Orange, and Red. Pick a color with the band at the top of this page.
        </p>
        <div className="stage mt-10 overflow-hidden rounded-[28px]">
          <Image
            src="/bands/joova-band-all-colors.png"
            alt="Joova Band lineup in black, blue, green, orange, and red."
            width={bandLineupSize.width}
            height={bandLineupSize.height}
            className="h-auto w-full"
            sizes="(min-width: 1024px) 1100px, 100vw"
          />
        </div>
      </Container>
    </Section>
  );
}
