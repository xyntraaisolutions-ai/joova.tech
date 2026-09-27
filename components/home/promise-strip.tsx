import { policies } from "@/content/site";
import { Container } from "@/components/ui/container";

const promises = [
  { kicker: "The price", text: "No subscription. Ever." },
  { kicker: "The box", text: "2 straps in every box" },
  { kicker: "The straps", text: policies.strapTitle },
];

export function PromiseStrip() {
  return (
    <section className="border-y border-stone">
      <Container className="grid md:grid-cols-3 md:px-0">
        {promises.map((item, index) => (
          <div
            key={item.text}
            className="min-w-0 border-stone px-5 py-8 sm:px-8 md:border-l md:px-8 md:py-12 md:first:border-l-0 lg:px-10"
          >
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-coral-ink">
              0{index + 1} · {item.kicker}
            </p>
            <p className="font-display mt-4 text-3xl font-extrabold leading-[1.08] xl:text-4xl">
              {item.text}
            </p>
          </div>
        ))}
      </Container>
    </section>
  );
}
