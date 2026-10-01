import { loadContentBundle } from "@/lib/content/load";
import { VideoPlayer } from "@/components/media/video-player";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";

export async function BoxContents() {
  const { inTheBox } = await loadContentBundle();
  return (
    <Section className="bg-stone/40">
      <Container className="grid gap-10 lg:grid-cols-2">
        <div>
          <h2
            className="font-display font-extrabold"
            style={{ fontSize: "var(--text-h2)" }}
          >
            1 strap in the box
          </h2>
          <p className="mt-4 max-w-md text-muted">
            The band comes with 1 woven strap in the color you choose.
          </p>
          <ul className="mt-8 space-y-3">
            {inTheBox.map((item) => (
              <li key={item} className="rounded-2xl bg-paper px-4 py-3">
                {item}
              </li>
            ))}
          </ul>
        </div>
        <VideoPlayer
          title="Strap swap loop (8–10s placeholder)"
          posterClassName="min-h-[360px]"
          autoPlay
        />
      </Container>
    </Section>
  );
}
