import { Container } from "@/components/ui/container";
import { loadContentBundle } from "@/lib/content/load";

export async function PromiseStrip() {
  const { policies } = await loadContentBundle();
  const promises = [
    { kicker: "The price", text: "No subscription needed. Ever." },
    { kicker: "The box", text: "1 strap in the box" },
    { kicker: "Returns", text: policies.returnsTitle },
  ];
  return (
    <section className="border-y border-stone">
      <Container className="grid md:grid-cols-3 md:px-0">
        {promises.map((item, index) => (
          <div
            key={item.text}
            className="min-w-0 border-stone px-5 py-8 sm:px-8 md:border-l md:px-8 md:py-12 md:first:border-l-0 lg:px-10"
          >
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-ink">
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
