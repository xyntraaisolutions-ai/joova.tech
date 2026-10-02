"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/components/layout/auth-provider";
import { useCart, type CartItem } from "@/components/layout/cart-provider";
import { PaymentNote } from "@/components/shop/payment-note";
import { useSiteContent } from "@/components/layout/site-content";
import { US_STATES } from "@/components/shop/us-states";
import { countries } from "@/lib/geo/countries";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CoverageLines, useProductCoverage } from "@/components/shop/coverage-lines";
import { purchaseText } from "@/lib/content/variants";
import { shippingWindow } from "@/lib/shipping/options";
import { formatUsd } from "@/lib/utils";

type ShipChoice = { code: string; name: string; price: number; minDays: number; maxDays: number };
type SavedAddress = { id: string; name: string; line1: string; line2: string; city: string; region: string; postal: string };

const shipCountries = [
  ...countries.filter((country) => country.code === "US"),
  ...countries.filter((country) => country.code !== "US").sort((left, right) => left.name.localeCompare(right.name)),
];

function outsideNotice(template: string, countryName: string) {
  const sentence = template.trim() || "Joova delivers in the United States today. We may start delivering to {{country}} soon. Thank you for visiting.";
  return sentence.replaceAll("{{country}}", countryName);
}

const HOLD_KEY = "joova-checkout";
const DRAFT_KEY = "joova-checkout-draft";

type CheckoutDraft = {
  guestEmail: string;
  name: string;
  line1: string;
  line2: string;
  city: string;
  region: string;
  postal: string;
  country: string;
  shipCode: string;
  promoCode: string;
};

function readDraft(): CheckoutDraft | null {
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const draft = JSON.parse(raw) as Partial<CheckoutDraft>;
    if (!draft || typeof draft !== "object") return null;
    return {
      guestEmail: typeof draft.guestEmail === "string" ? draft.guestEmail : "",
      name: typeof draft.name === "string" ? draft.name : "",
      line1: typeof draft.line1 === "string" ? draft.line1 : "",
      line2: typeof draft.line2 === "string" ? draft.line2 : "",
      city: typeof draft.city === "string" ? draft.city : "",
      region: typeof draft.region === "string" ? draft.region : "",
      postal: typeof draft.postal === "string" ? draft.postal : "",
      country: typeof draft.country === "string" ? draft.country : "US",
      shipCode: typeof draft.shipCode === "string" ? draft.shipCode : "",
      promoCode: typeof draft.promoCode === "string" ? draft.promoCode : "",
    };
  } catch {
    return null;
  }
}

function OrderLine({ item }: { item: CartItem }) {
  const coverage = useProductCoverage(item.productId, item.name);
  return (
    <li>
      <p className="font-bold">{item.name} × {item.quantity}</p>
      {purchaseText(item.selection, item.color) ? <p className="text-muted">{purchaseText(item.selection, item.color)}</p> : null}
      <CoverageLines coverage={coverage} />
      <p>{formatUsd(item.price * item.quantity)}</p>
    </li>
  );
}

export function CheckoutReview() {
  const { items, subtotal } = useCart();
  const { user, ready } = useAuth();
  const { market, policies } = useSiteContent();
  const params = useSearchParams();
  const [guestEmail, setGuestEmail] = useState("");
  const [name, setName] = useState("");
  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [region, setRegion] = useState("TX");
  const [postal, setPostal] = useState("");
  const [country, setCountry] = useState("US");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);
  const [tax, setTax] = useState<{ label: string; tax: number; total: number; regionName: string; parts: string } | null>(null);
  const [taxError, setTaxError] = useState("");
  const [taxNote, setTaxNote] = useState("");
  const [taxPending, setTaxPending] = useState(false);
  const [shipChoices, setShipChoices] = useState<ShipChoice[]>([]);
  const [shipCode, setShipCode] = useState("");
  const [shipError, setShipError] = useState("");
  const [promoCode, setPromoCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [promoError, setPromoError] = useState("");
  const [promoStatus, setPromoStatus] = useState<"idle" | "checking" | "applied">("idle");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const draftKept = useRef(false);

  useEffect(() => {
    const draft = readDraft();
    if (!draft) return;
    draftKept.current = true;
    if (draft.guestEmail) setGuestEmail(draft.guestEmail);
    if (draft.name) setName(draft.name);
    if (draft.line1) setLine1(draft.line1);
    if (draft.line2) setLine2(draft.line2);
    if (draft.city) setCity(draft.city);
    if (draft.region) setRegion(draft.region);
    if (draft.postal) setPostal(draft.postal);
    if (draft.country && shipCountries.some((item) => item.code === draft.country)) setCountry(draft.country);
    if (draft.shipCode) setShipCode(draft.shipCode);
    if (draft.promoCode) setPromoCode(draft.promoCode);
  }, []);

  useEffect(() => {
    if (readDraft()?.country) return;
    if (market.code !== "US" && shipCountries.some((item) => item.code === market.code)) {
      setCountry(market.code);
      setRegion("");
    }
  }, [market.code]);

  useEffect(() => {
    if (user?.name) setName((current) => current || user.name);
  }, [user]);

  useEffect(() => {
    if (!user) {
      setSavedAddresses([]);
      return;
    }
    void fetch("/api/account/addresses")
      .then((response) => response.json())
      .then((body: { addresses?: SavedAddress[] }) => {
        const addresses = body.addresses ?? [];
        setSavedAddresses(addresses);
        if (draftKept.current) return;
        const chosen = addresses[0];
        if (!chosen) return;
        setName((current) => current || chosen.name);
        setLine1((current) => current || chosen.line1);
        setLine2((current) => current || chosen.line2 || "");
        setCity((current) => current || chosen.city);
        setRegion((current) => current === "TX" && chosen.region ? chosen.region : current);
        setPostal((current) => current || chosen.postal);
      })
      .catch(() => setSavedAddresses([]));
  }, [user]);

  useEffect(() => {
    if (params.get("cancelled") !== "1") return;
    const raw = sessionStorage.getItem(HOLD_KEY);
    sessionStorage.removeItem(HOLD_KEY);
    setNotice("Payment was not completed. You can edit this order and try again. Nothing was charged.");
    if (!raw) return;
    try {
      const hold = JSON.parse(raw) as { orderId?: string; token?: string };
      if (!hold.orderId || !hold.token) return;
      void fetch("/api/checkout/release", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: hold.orderId, token: hold.token }),
      });
    } catch {
      /* The hold was not stored. */
    }
  }, [params]);

  useEffect(() => {
    const zip = postal.trim().slice(0, 5);
    if (country !== "US" || !/^[0-9]{5}$/.test(zip) || items.length === 0) {
      setTax(null);
      setTaxError("");
      setTaxNote("");
      return;
    }
    const timer = window.setTimeout(() => {
      setTaxPending(true);
      void fetch("/api/tax/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          region,
          postal: zip,
          items: items.map((item) => ({ productId: item.productId || item.id, quantity: item.quantity })),
        }),
      }).then(async (response) => {
        const body = (await response.json().catch(() => null)) as { label?: string; tax?: number; total?: number; regionName?: string; parts?: string; state?: string; fallback?: boolean; error?: string } | null;
        setTaxPending(false);
        if (body?.state && body.state !== region) {
          const name = US_STATES.find(([code]) => code === body.state)?.[1] ?? body.state;
          setRegion(body.state);
          setTax(null);
          setTaxError("");
          setTaxNote(`This ZIP code is in ${name}. Sales tax uses that state's rate.`);
          return;
        }
        if (!response.ok || !body || typeof body.tax !== "number" || typeof body.total !== "number" || !body.label) {
          setTax(null);
          setTaxError(body?.error ?? "Sales tax could not be calculated.");
          return;
        }
        setTaxError("");
        setTaxNote(body.fallback ? "This ZIP code is not in the rate table. The default United States rate is used." : "");
        setTax({ label: body.label, tax: body.tax, total: body.total, regionName: body.regionName ?? "", parts: body.parts ?? "" });
      }).catch(() => {
        setTaxPending(false);
        setTax(null);
        setTaxError("Sales tax could not be calculated.");
      });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [country, items, postal, region]);

  useEffect(() => {
    const productIds = items.map((item) => item.productId || item.id);
    if (!productIds.length) return;
    void fetch("/api/shipping/quote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productIds }),
    }).then(async (response) => {
      const body = (await response.json().catch(() => null)) as { options?: ShipChoice[]; error?: string } | null;
      if (!response.ok || !body?.options?.length) {
        setShipChoices([]);
        setShipCode("");
        setShipError(body?.error ?? "Shipping options could not be loaded.");
        return;
      }
      setShipError("");
      setShipChoices(body.options);
      setShipCode((current) => body.options?.some((option) => option.code === current) ? current : body.options?.[0]?.code ?? "");
    }).catch(() => {
      setShipChoices([]);
      setShipError("Shipping options could not be loaded.");
    });
  }, [items]);

  useEffect(() => {
    const code = promoCode.trim();
    if (!code) {
      setDiscount(0);
      setPromoError("");
      setPromoStatus("idle");
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setPromoStatus("checking");
      void fetch("/api/promo/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
        signal: controller.signal,
      }).then(async (response) => {
        if (controller.signal.aborted) return;
        const body = (await response.json().catch(() => null)) as { ok?: boolean; discount?: number; reason?: string; error?: string } | null;
        if (controller.signal.aborted) return;
        if (!response.ok || !body) {
          setDiscount(0);
          setPromoStatus("idle");
          setPromoError(body?.error ?? "That promo code could not be checked. Remove it, or enter another.");
          return;
        }
        if (body.ok) {
          setDiscount(Number(body.discount ?? 0));
          setPromoError("");
          setPromoStatus("applied");
          return;
        }
        setDiscount(0);
        setPromoStatus("idle");
        setPromoError(
          body.reason === "expired"
            ? "That promo code has expired. Remove it, or enter another."
            : body.reason === "not_yet"
              ? "That promo code is not available yet. Remove it, or enter another."
              : "That promo code is not valid. Remove it, or enter another.",
        );
      }).catch((cause: unknown) => {
        if (cause instanceof DOMException && cause.name === "AbortError") return;
        setDiscount(0);
        setPromoStatus("idle");
        setPromoError("That promo code could not be checked. Remove it, or enter another.");
      });
    }, 450);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [promoCode, subtotal]);

  async function pay() {
    if (country !== "US") return;
    setError("");
    setPending(true);
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items,
        guestEmail: user ? undefined : guestEmail,
        shipping: { name, line1, line2, city, region, postal, country },
        shippingOption: shipCode,
        promoCode,
      }),
    });
    const body = (await response.json().catch(() => null)) as { url?: string; orderId?: string; token?: string; error?: string } | null;
    if (!response.ok || !body?.url || !body.orderId || !body.token) {
      setPending(false);
      setError(body?.error ?? "Payment could not be started.");
      return;
    }
    sessionStorage.setItem(HOLD_KEY, JSON.stringify({ orderId: body.orderId, token: body.token }));
    const draft: CheckoutDraft = { guestEmail, name, line1, line2, city, region, postal, country, shipCode, promoCode };
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    window.location.assign(body.url);
  }

  const ship = shipChoices.find((option) => option.code === shipCode);
  const merchandise = tax ? Math.round((tax.total - tax.tax) * 100) / 100 : subtotal;
  const ratio = merchandise > 0 ? Math.max(0, merchandise - discount) / merchandise : 1;
  const shownTax = tax ? Math.round(tax.tax * ratio * 100) / 100 : 0;
  const orderTotal = Math.max(0, Math.round((merchandise - discount + shownTax + (ship?.price ?? 0)) * 100) / 100);

  if (!ready) return <p className="text-muted">Loading checkout.</p>;
  if (items.length === 0) {
    return (
      <p className="text-muted">
        Your cart is empty. <Link className="font-bold text-ink underline" href="/shop">Shop Joova</Link>
      </p>
    );
  }

  return (
    <form
      className="grid gap-8 max-md:pb-28 lg:grid-cols-[minmax(0,1fr)_320px]"
      onSubmit={(event) => {
        event.preventDefault();
        void pay();
      }}
    >
      <div className="space-y-6">
        {notice ? <p role="status">{notice}</p> : null}
        <section className="rounded-3xl border border-stone bg-white p-5">
          <h2 className="font-display text-2xl">Contact</h2>
          {user ? (
            <p className="mt-3 text-sm text-muted">Signed in as {user.name}. {user.email}</p>
          ) : (
            <label className="mt-4 block text-sm">
              Email for this order
              <Input className="mt-2" type="email" required autoComplete="email" value={guestEmail} onChange={(event) => setGuestEmail(event.target.value)} />
            </label>
          )}
          {!user ? (
            <p className="mt-3 text-sm text-muted">
              No account is required. <Link className="font-bold text-ink underline" href="/account?mode=sign-in&next=/checkout">Sign in</Link> if you already have one.
            </p>
          ) : null}
        </section>
        <section className="rounded-3xl border border-stone bg-white p-5">
          <h2 className="font-display text-2xl">Ship to</h2>
          <p className="mt-2 text-sm text-muted">
            {country === "US" ? "United States delivery. Choose a shipping option before you pay." : "Tell us where to send it."}
          </p>
          <label className="mt-4 block text-sm">
            Country
            <select
              className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
              required
              autoComplete="country"
              value={country}
              onChange={(event) => {
                const code = event.target.value;
                setCountry(code);
                if (code !== "US" && US_STATES.some(([state]) => state === region)) setRegion("");
                if (code === "US" && !US_STATES.some(([state]) => state === region)) setRegion("TX");
              }}
            >
              {shipCountries.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}
            </select>
          </label>
          {country !== "US" ? (
            <p className="mt-4 rounded-3xl border border-stone bg-paper p-4 text-sm" role="status">
              {outsideNotice(policies.outsideUsNotice, shipCountries.find((item) => item.code === country)?.name ?? "your area")}
            </p>
          ) : null}
          {savedAddresses.length ? (
            <label className="mt-4 block text-sm">
              Saved address
              <select
                className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4"
                defaultValue=""
                onChange={(event) => {
                  const chosen = savedAddresses.find((address) => address.id === event.target.value);
                  if (!chosen) return;
                  setName(chosen.name);
                  setLine1(chosen.line1);
                  setLine2(chosen.line2 || "");
                  setCity(chosen.city);
                  setRegion(chosen.region);
                  setPostal(chosen.postal);
                }}
              >
                <option value="">Choose a saved address</option>
                {savedAddresses.map((address) => (
                  <option key={address.id} value={address.id}>{address.name} · {address.line1}, {address.city}</option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="mt-4 grid gap-3">
            <label className="text-sm">Full name<Input className="mt-2" required autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label className="text-sm">Address<Input className="mt-2" required autoComplete="address-line1" value={line1} onChange={(event) => setLine1(event.target.value)} /></label>
            <label className="text-sm">Apartment, suite <span className="text-muted">(optional)</span><Input className="mt-2" autoComplete="address-line2" value={line2} onChange={(event) => setLine2(event.target.value)} /></label>
            <label className="text-sm">City<Input className="mt-2" required autoComplete="address-level2" value={city} onChange={(event) => setCity(event.target.value)} /></label>
            <div className="grid gap-3 sm:grid-cols-2">
              {country === "US" ? (
                <label className="text-sm">
                  State
                  <select className="mt-2 h-12 w-full rounded-2xl border border-stone bg-white px-4" required autoComplete="address-level1" value={region} onChange={(event) => setRegion(event.target.value)}>
                    {US_STATES.map(([code, label]) => <option key={code} value={code}>{label}</option>)}
                  </select>
                </label>
              ) : (
                <label className="text-sm">State or province<Input className="mt-2" autoComplete="address-level1" value={region} onChange={(event) => setRegion(event.target.value)} /></label>
              )}
              <label className="text-sm">{country === "US" ? "ZIP code" : "Postal code"}<Input className="mt-2" required={country === "US"} autoComplete="postal-code" inputMode={country === "US" ? "numeric" : "text"} value={postal} onChange={(event) => setPostal(event.target.value)} /></label>
            </div>
          </div>
        </section>
      </div>
      <aside className="h-fit rounded-3xl border border-stone bg-white p-5">
        <h2 className="font-display text-2xl">Order</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((item) => (
            <OrderLine key={item.id} item={item} />
          ))}
        </ul>
        <fieldset className="mt-4 space-y-2">
          <legend className="text-sm font-bold">Shipping</legend>
          {shipChoices.map((option) => (
            <label key={option.code} className="flex items-start gap-2 text-sm">
              <input
                className="mt-1"
                type="radio"
                name="shipping-option"
                required
                checked={shipCode === option.code}
                onChange={() => setShipCode(option.code)}
              />
              <span>
                <span className="font-bold">{option.name}</span>
                <span className="block text-muted">{option.price > 0 ? formatUsd(option.price) : "Free"} · {shippingWindow(option)}</span>
              </span>
            </label>
          ))}
          {shipError ? <p className="text-sm" role="alert">{shipError}</p> : null}
        </fieldset>
        <label className="mt-4 block text-sm">
          Promo code <span className="text-muted">(optional)</span>
          <Input
            className="mt-2 uppercase"
            value={promoCode}
            autoCapitalize="characters"
            autoComplete="off"
            aria-invalid={Boolean(promoError)}
            onChange={(event) => {
              const value = event.target.value.toUpperCase();
              setPromoCode(value);
              setDiscount(0);
              setPromoError("");
              setPromoStatus(value.trim() ? "checking" : "idle");
            }}
          />
        </label>
        {promoStatus === "checking" ? <p className="mt-1 text-sm text-muted">Checking that code.</p> : null}
        {promoStatus === "applied" && !promoError ? <p className="mt-1 text-sm">{discount > 0 ? `${formatUsd(discount)} off.` : "Applied."}</p> : null}
        {promoError ? (
          <p className="mt-1 text-sm" role="alert">
            {promoError}{" "}
            <button
              type="button"
              className="font-bold underline"
              onClick={() => {
                setPromoCode("");
                setDiscount(0);
                setPromoError("");
                setPromoStatus("idle");
              }}
            >
              Remove
            </button>
          </p>
        ) : null}
        {discount > 0 ? <p className="mt-2 flex justify-between text-sm"><span>Discount</span><span>−{formatUsd(discount)}</span></p> : null}
        <p className="mt-4 flex justify-between text-sm"><span>Subtotal</span><span>{formatUsd(subtotal)}</span></p>
        <p className="mt-1 flex justify-between text-sm"><span>Shipping</span><span>{ship ? (ship.price > 0 ? formatUsd(ship.price) : "Free") : "—"}</span></p>
        <p className="mt-1 flex justify-between text-sm">
          <span>Sales tax{tax ? ` (${tax.label})` : ""}</span>
          <span>{taxPending ? "Calculating" : tax ? formatUsd(shownTax) : "—"}</span>
        </p>
        {tax?.parts ? <p className="mt-1 text-sm text-muted">{tax.parts}</p> : null}
        {tax?.regionName ? <p className="mt-1 text-sm text-muted">{tax.regionName}</p> : null}
        {tax && tax.tax === 0 ? <p className="mt-1 text-sm text-muted">No sales tax for this ZIP code.</p> : null}
        {taxNote ? <p className="mt-1 text-sm text-muted">{taxNote}</p> : null}
        {taxError ? <p className="mt-1 text-sm" role="alert">{taxError}</p> : null}
        {country === "US" && !tax && !taxError && !taxPending && !taxNote ? <p className="mt-1 text-sm text-muted">Enter a ZIP code to calculate sales tax.</p> : null}
        <p className="mt-2 flex justify-between font-bold"><span>Total</span><span>{formatUsd(orderTotal)}</span></p>
        <p className="mt-2 text-sm text-muted">{ship ? shippingWindow(ship) : "Choose shipping to see the delivery window."} <Link className="font-bold text-ink underline" href="/cart">Edit cart</Link></p>
        <div className="mt-4"><PaymentNote /></div>
        {error ? <p className="mt-3 text-sm" role="alert">{error}</p> : null}
        <Button className="mt-4 w-full" type="submit" disabled={country !== "US" || pending || taxPending || !tax || !ship || promoStatus === "checking" || Boolean(promoError)}>{pending ? "Opening secure payment" : "Pay now"}</Button>
      </aside>
      <div className="h-0 md:hidden">
        <div
          className="fixed inset-x-0 z-30 border-t border-stone bg-paper/95 p-3 backdrop-blur"
          style={{ bottom: "calc(var(--app-tab) + env(safe-area-inset-bottom))" }}
        >
          <div className="mx-auto flex max-w-[1280px] items-center gap-3">
            <p className="min-w-0 flex-1 font-bold">{formatUsd(orderTotal)}</p>
            <Button type="submit" disabled={country !== "US" || pending || taxPending || !tax || !ship || promoStatus === "checking" || Boolean(promoError)}>
              {pending ? "Opening" : "Pay now"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
