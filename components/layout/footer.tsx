import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { PaymentMarks } from "@/components/layout/payment-marks";
import { SocialIcons } from "@/components/layout/social-icons";
import { company } from "@/content/site";
import { Container } from "@/components/ui/container";

const groups = [
  {
    title: "Customer",
    links: [
      { href: "/reviews", label: "Reviews" },
      { href: "/track", label: "Track order" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
      { href: "/accessibility", label: "Accessibility" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="cinematic">
      <div className="h-px bg-coral" aria-hidden="true" />
      <Container className="py-12 md:py-16">
        <div className="grid gap-10 md:grid-cols-[minmax(0,26rem)_auto] md:items-start md:justify-between md:gap-16">
          <div className="footer-brand max-w-md">
            <Link href="/" aria-label="Joova home">
              <Logo />
            </Link>
            <p className="mt-4 text-stone">
              Joova brings smart, simple and fairly priced technology into everyday life. Built by Joova Tech LLC in the USA. Smarter Tech | Bigger Tomorrow.
            </p>
          </div>
          <nav aria-label="Footer" className="grid grid-cols-2 gap-10 sm:gap-16">
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
              Business address: {company.address}
            </p>
            <p className="mt-3">Also on Amazon and TikTok Shop (links coming).</p>
          </div>
          <SocialIcons />
        </div>

        <div className="mt-8 flex flex-col gap-6 border-t border-paper/15 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <PaymentMarks />
          <p className="text-sm text-stone">{company.copyright}</p>
        </div>
      </Container>
    </footer>
  );
}
