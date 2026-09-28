import Link from "next/link";
import { productsMenu } from "@/content/site";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

const blurbs: Record<(typeof productsMenu)[number]["href"], string> = {
  "/band": "Screenless woven band. Five colors, two straps in every box, and the app with no monthly fee.",
  "/ring": "Screenless ring in five finishes. Sleep, activity, and heart-rate trends.",
};

export function ProductIndex() {
  return (
    <section className="border-t border-stone">
      <Container className="py-16 md:py-24">
        <h2
          className="font-display font-extrabold"
          style={{ fontSize: "var(--text-h2)" }}
        >
          Products
        </h2>
        <ul className="mt-10 grid gap-6 md:grid-cols-2">
          {productsMenu.map((item) => (
            <li key={item.href} className="flex flex-col rounded-3xl border border-stone bg-white p-8">
              <h3 className="font-display text-3xl font-extrabold">{item.label}</h3>
              <p className="mt-4 text-muted">{blurbs[item.href]}</p>
              <Link href={item.href} className={`${buttonClassName("primary")} mt-8 w-fit`}>
                See Details
              </Link>
            </li>
          ))}
        </ul>
      </Container>
    </section>
  );
}
