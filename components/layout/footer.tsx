"use client";

import Link from "next/link";
import { useState } from "react";
import { Logo } from "@/components/brand/logo";
import { company, nav, socialLinks } from "@/content/site";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Input } from "@/components/ui/input";

export function Footer() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success">("idle");

  return (
    <footer className="border-t border-stone bg-paper py-16">
      <Container className="grid gap-12 md:grid-cols-4">
        <div className="md:col-span-2">
          <Link href="/" aria-label="Joova home">
            <Logo />
          </Link>
          <p className="mt-3 max-w-md text-muted">
            Joova Band. $49.99. No subscription. Ever.
          </p>
          <form
            className="mt-6 flex max-w-md flex-col gap-3 sm:flex-row"
            onSubmit={(event) => {
              event.preventDefault();
              if (!email) return;
              setStatus("success");
            }}
          >
            <label className="sr-only" htmlFor="newsletter">
              Email for news
            </label>
            <Input
              id="newsletter"
              type="email"
              required
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Button type="submit">Join waitlist</Button>
          </form>
          {status === "success" ? (
            <p className="mt-3 text-sm text-muted" role="status">
              You&apos;re in. We&apos;ll email your $10 off code when the
              waitlist is live. Signups are not stored yet (no backend).
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Join the waitlist for $10 off. Email only for now.
            </p>
          )}
        </div>
        <div>
          <p className="font-medium">Shop</p>
          <ul className="mt-3 space-y-2 text-muted">
            {nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href}>{item.label}</Link>
              </li>
            ))}
            <li>
              <Link href="/straps">Straps</Link>
            </li>
            <li>
              <Link href="/reviews">Reviews</Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="font-medium">Company</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li>
              <Link href="/about">About</Link>
            </li>
            <li>
              <Link href="/contact">Contact</Link>
            </li>
            <li>
              <Link href="/warranty">Warranty</Link>
            </li>
            <li>
              <Link href="/returns">Returns</Link>
            </li>
            <li>
              <Link href="/track">Track order</Link>
            </li>
            <li>
              <Link href="/privacy">Privacy</Link>
            </li>
            <li>
              <Link href="/terms">Terms</Link>
            </li>
            <li>
              <Link href="/accessibility">Accessibility</Link>
            </li>
          </ul>
        </div>
      </Container>
      <Container className="mt-12 flex flex-col gap-4 border-t border-stone pt-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
        <p>
          {company.legalName}
          <br />
          {company.address}
        </p>
        <div className="flex flex-wrap gap-4">
          {socialLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank" rel="noreferrer">
              {link.label}
            </a>
          ))}
        </div>
      </Container>
      <Container className="mt-6 flex flex-wrap items-center justify-between gap-4 text-sm text-muted">
        <p>Also on Amazon and TikTok Shop (links coming).</p>
        <p>Shop Pay · Apple Pay · PayPal · Cards via Shopify checkout later</p>
      </Container>
    </footer>
  );
}
