import Link from "next/link";
import { catalog, catalogCategories, productsInCategory } from "@/content/catalog";
import { policies } from "@/content/site";
import { DealList } from "@/components/shop/deal-list";
import { ProductCard } from "@/components/shop/product-card";
import { Container } from "@/components/ui/container";

const assurances = [
  { title: "Free US shipping", copy: policies.shipping },
  { title: policies.returnsTitle, copy: policies.returnsSummary },
  { title: "US-based support", copy: "Every message gets a reply within 6 to 24 hours." },
] as const;

export function Storefront() {
  return (
    <>
      <section className="border-t border-stone" aria-label="Shop by category">
        <Container className="py-6 md:py-10">
          <div className="-mx-5 flex gap-3 overflow-x-auto px-5 pb-1 snap-x snap-mandatory [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden">
            {catalogCategories.map((category) => (
              <Link
                key={category.id}
                href={category.href}
                className="min-w-[15.5rem] snap-start rounded-3xl border border-stone bg-white px-5 py-4 hover:border-ink/30 sm:min-w-0"
              >
                <p className="font-display text-xl font-extrabold md:text-2xl">{category.label}</p>
                <p className="mt-1 text-sm text-muted md:text-base">{category.summary}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <section className="border-t border-stone">
        <Container className="py-10 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
              Shop
            </h2>
            <Link href="/shop" className="text-sm font-medium underline underline-offset-4">
              All products
            </Link>
          </div>
          <ul className="mt-6 grid gap-4 sm:mt-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {catalog.map((product) => (
              <li key={product.id}>
                <ProductCard product={product} />
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section className="border-t border-stone bg-white">
        <Container className="py-10 md:py-20">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="font-display font-extrabold" style={{ fontSize: "var(--text-h2)" }}>
                Deals
              </h2>
              <p className="mt-3 max-w-xl text-muted">
                Extra woven straps in five colors. Every product is available now.
              </p>
            </div>
            <Link href="/deals" className="text-sm font-medium underline underline-offset-4">
              All deals
            </Link>
          </div>
          <div className="mt-10">
            <DealList />
          </div>
        </Container>
      </section>

      <section className="border-t border-stone">
        <Container className="grid gap-6 py-12 md:grid-cols-3">
          {assurances.map((item) => (
            <div key={item.title}>
              <p className="font-display text-xl font-extrabold">{item.title}</p>
              <p className="mt-2 text-muted">{item.copy}</p>
            </div>
          ))}
        </Container>
      </section>
    </>
  );
}

export function CategorySections() {
  return (
    <div className="space-y-16">
      {catalogCategories.map((category) => {
        const products = productsInCategory(category.id);
        if (products.length === 0) return null;
        return (
          <section key={category.id} id={category.id} className="scroll-mt-24">
            <h2 className="font-display text-3xl font-extrabold">{category.label}</h2>
            <p className="mt-2 text-muted">{category.summary}</p>
            <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
                <li key={product.id}>
                  <ProductCard product={product} />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
