"use client";

import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PaymentMarks } from "@/components/layout/payment-marks";
import { SocialIcons } from "@/components/layout/social-icons";
import { useSiteContent } from "@/components/layout/site-content";
import { Container } from "@/components/ui/container";

function brandWithoutSlogan(blurb: string, slogan: string) {
  let text = blurb.trim();
  for (const ending of [`${slogan}.`, slogan]) {
    if (text.endsWith(ending)) return text.slice(0, -ending.length).trim();
  }
  return text;
}

export function Footer() {
  const { company, navItems, footerBlurb, headerSlogan, storeLinks } = useSiteContent();
  const slogan = headerSlogan.trim().replace(/\.$/, "");
  const brand = brandWithoutSlogan(footerBlurb, slogan);
  const groups = navItems
    .filter((item) => item.area === "footer" && !item.parentId)
    .map((group) => ({
      title: group.label,
      links: navItems.filter((item) => item.parentId === group.id),
    }));
  return (
    <footer className="cinematic">
      <div className="h-px bg-coral" aria-hidden="true" />
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,26rem)_auto] md:items-start md:justify-between md:gap-16">
          <div className="footer-brand max-w-md">
            <Link href="/" aria-label={`${company.brand} home`}>
              <Logo />
            </Link>
            <p className="mt-4 text-stone">
              {brand}
              {brand ? <br /> : null}
              {slogan}
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-12">
            {groups.map((group) => (
              <div key={group.title}>
                <p className="text-xs font-bold uppercase tracking-[2.5px] text-stone">{group.title}</p>
                <ul className="mt-3">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link href={link.href} className="inline-flex min-h-11 items-center text-paper underline-offset-4 hover:underline">
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        <div className="mt-12 flex flex-col gap-6 border-t border-paper/15 pt-8 sm:flex-row sm:items-end sm:justify-between">
          <div className="text-sm text-stone">
            <p>
              {company.legalName}
              <br />
              {company.address}
            </p>
            {storeLinks.length ? (
              <ul className="mt-3">
                {storeLinks.map((store) => (
                  <li key={store.id}>
                    {store.href ? (
                      <a
                        href={store.href}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex min-h-11 items-center text-paper underline-offset-4 hover:underline"
                      >
                        {store.label}
                      </a>
                    ) : (
                      <span className="inline-flex min-h-11 items-center text-stone">{store.label}</span>
                    )}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
          <SocialIcons />
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-paper/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <PaymentMarks />
            <p className="mt-3 max-w-sm text-sm text-stone">Card details are entered on Stripe. Joova does not store your card number.</p>
          </div>
          <p className="text-sm text-stone">{company.copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
