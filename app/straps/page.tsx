import { BandPhoto } from "@/components/media/band-photo";
import { ProductTurntable } from "@/components/media/product-turntable";
import Link from "next/link";
import { bandImageSize, policies, straps } from "@/content/site";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";

export default function StrapsPage() {
  return (
    <Container className="py-10 md:py-16">
      <h1
        className="font-display font-extrabold"
        style={{ fontSize: "var(--text-h1)" }}
      >
        Woven straps
      </h1>
      <p className="mt-4 max-w-2xl text-muted">
        Every Joova Band is a woven loop with a silver buckle and a black
        tracker. The box includes the strap you wear plus one extra. You choose
        both colors when you order. {policies.strapSummary}
      </p>
      <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {straps.map((strap) => (
          <li key={strap.id} className="stage rounded-3xl border border-stone p-5">
            <ProductTurntable>
              <BandPhoto
                src={strap.image}
                alt={strap.name}
                width={bandImageSize.width}
                height={bandImageSize.height}
                frameClassName="mx-auto"
                className="h-64 w-auto"
              />
            </ProductTurntable>
            <h2 className="mt-4 font-display text-xl font-bold">{strap.name}</h2>
            <p className="text-sm text-muted">
              {strap.material} · {strap.collection}
            </p>
            <Link href="/band" className={`${buttonClassName("primary", "sm")} mt-4`}>
              Choose this color
            </Link>
          </li>
        ))}
      </ul>
    </Container>
  );
}
