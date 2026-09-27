# Joova Band Website: Implementation Plan

> Build guide for Cursor. Read this whole file before writing code. Work phase by phase, check off tasks, and do not start a phase until the previous phase's acceptance criteria pass.

---

## 0. Project summary

| Item | Value |
| --- | --- |
| Brand | **Joova** |
| Product | **Joova Band**: screenless fitness tracker, no subscription |
| Price | **$49.99** (USD). Canada in CAD from January 2027 |
| Core promise | **"No subscription. Ever."** |
| Other promises | 3 straps in every box, lifetime warranty on straps, 2-year warranty on the tracker (free 3rd year when registered in the app), 60-day free returns |
| Markets | United States (launch Nov 18, 2026), Canada (January 2027) |
| Sales channels the site must support | Direct checkout (Shopify), links out to Amazon and TikTok Shop |
| Key dates | Waitlist live **Oct 10**; pre-orders live **Oct 15**; full site with video **Nov 10**; launch **Nov 18**; Black Friday **Nov 27** |
| Owners | Satya (build, tech), Puzan (content, copy, video, marketing tools) |

### Goals (in order)

1. Sell bands: fast, trustworthy path from landing to checkout.
2. Explain the product in under 10 seconds: what it is, what it costs, no subscription.
3. Look world class: cinematic video, smooth motion, premium type, but never at the cost of speed.
4. Build trust: real reviews, clear warranty/returns, real company details.
5. Capture emails (waitlist, pre-order, abandoned cart) for launch.

### Success metrics

| Metric | Target |
| --- | --- |
| Conversion rate (sessions to orders) | 2.5%+ after launch |
| Waitlist signups before launch | 2,000 |
| Mobile Lighthouse Performance / Accessibility / SEO | 90+ / 95+ / 95+ |
| Largest Contentful Paint (mobile, 4G) | under 2.5 s |
| Cumulative Layout Shift | under 0.1 |
| Interaction to Next Paint | under 200 ms |

---

## 1. Tech stack

| Layer | Choice | Why |
| --- | --- | --- |
| Framework | **Next.js (latest stable, App Router) + TypeScript (strict)** | Fast, SEO-friendly, great with Vercel, well supported in Cursor |
| Styling | **Tailwind CSS v4** with design tokens as CSS variables | Fast iteration, consistent system |
| UI primitives | **Radix UI** (via shadcn/ui components, restyled) | Accessible dialogs, accordions, tabs |
| Animation | **Motion** (formerly Framer Motion) for UI; **GSAP + ScrollTrigger** for scroll stories; **Lenis** for smooth scroll | Premium, controllable motion |
| 3D (Phase 3, optional) | **React Three Fiber + drei**, GLB model of the band | Interactive 360 viewer / color configurator |
| Commerce | **Shopify** (Basic plan) via **Storefront API** (headless); Shopify-hosted checkout | Secure checkout, Shop Pay, Apple Pay, PayPal, taxes, pre-orders |
| CMS | **Sanity** (free tier) for editable content: hero copy, FAQs, press, UGC videos | Puzan edits content without code. Phase 1 may start with local JSON/MDX |
| Video | **Mux** (HLS adaptive streaming, auto posters, captions) | Smooth playback on any connection |
| Images | `next/image` with AVIF/WebP; source images stored in Sanity or `/public` | Speed |
| Reviews | **Judge.me** (API / widgets) | Verified buyer reviews with photos; imports Amazon reviews where allowed |
| Email and SMS | **Klaviyo** (waitlist, welcome flow, abandoned cart, back-in-stock) | Industry standard for Shopify |
| Order tracking | **AfterShip** tracking page (or Shopify order status) | "Track my order" |
| Support | **Gorgias** or **Shopify Inbox** live chat + help center | Fast answers, one inbox |
| Analytics | **GA4**, **Meta Pixel + Conversions API**, **TikTok Pixel**, **Vercel Analytics** (Core Web Vitals) | Ads and funnel measurement |
| Consent | Cookie consent banner (e.g. Klaro or CookieYes) that gates marketing pixels | Privacy compliance |
| Hosting | **Vercel** (Pro when traffic grows) | Edge CDN, previews per branch |
| Domain / DNS | Joova domain on Cloudflare or Vercel DNS | |
| Testing | Vitest, Playwright (E2E), axe-core (accessibility) | |
| Quality | ESLint, Prettier, TypeScript strict, Husky pre-commit, GitHub Actions CI | |

**Do not** build custom checkout or store card data. Always hand off to Shopify Checkout.

---

## 2. Brand and design system

### 2.1 Voice

- Confident, warm, plain English. Short sentences.
- Lead with the promise: "$49.99. No subscription. Ever."
- Wellness language only: sleep, activity, heart-rate trends, recovery. **No medical or diagnostic claims** (no "detects", "diagnoses", "treats", "medical-grade").
- Never invent numbers, reviews, or "X people are viewing" counters.

### 2.2 Color tokens

Define in `app/globals.css` as CSS variables, map in Tailwind theme.

```css
:root {
  /* Brand */
  --joova-ink: #15171C;        /* primary dark, text */
  --joova-paper: #F6F3EE;      /* warm off-white background */
  --joova-coral: #F26B4E;      /* brand accent (buttons, highlights) */
  --joova-coral-ink: #B8402A;  /* accessible coral for text on light */
  --joova-stone: #E5DFD6;      /* borders, dividers */
  --joova-muted: #5F5A53;      /* secondary text */

  /* Product colors (swatches) */
  --band-black: #1E2026;
  --band-blue: #2F6BC8;
  --band-green: #2F8A5A;
  --band-orange: #FF8424;
  --band-red: #D8302E;
  --pod-graphite: #2A2D34;
}
```

- Light theme is the default (warm paper). Dark sections (`--joova-ink` background) for cinematic video and "night / sleep" storytelling.
- Check all text for WCAG AA contrast (4.5:1 body, 3:1 large). Coral `#F26B4E` is for fills and large text only; use `--joova-coral-ink` for small coral text on light backgrounds.

### 2.3 Typography

- Display: **Syne** (600-800) for headlines.
- Body/UI: **DM Sans** (400-700).
- Load with `next/font/google`, `display: swap`, subset latin.
- Type scale (fluid with `clamp`): Display 56-96px, H1 40-64, H2 32-48, H3 22-28, Body 17-18, Small 14.

### 2.4 Layout and motion principles

- 12-column grid, max width 1280px, generous white space, 8px spacing scale.
- Large product imagery on warm backgrounds; rounded corners 16-24px.
- Motion: subtle and purposeful. Durations 200-600ms, ease `cubic-bezier(0.22, 1, 0.36, 1)`.
- **Respect `prefers-reduced-motion`**: disable parallax, scroll-jacking, autoplay video (show poster), and Lenis smooth scroll.
- Never block reading with scroll-jacking; scroll stories must work with normal scrolling and keyboard.

---

## 3. Site map

| Route | Page | Phase |
| --- | --- | --- |
| `/` | Home (the main marketing story) | 1 (waitlist version), 2 (full) |
| `/band` | Joova Band product page with color picker and Buy | 2 |
| `/straps` | Strap collection (accessories) | 2 |
| `/app` | The Joova app: screens, features, Apple Health / Google Health Connect | 2 |
| `/no-subscription` | Why no subscription: cost calculator and promise | 2 |
| `/reviews` | All reviews + creator videos | 3 |
| `/warranty` | Warranty terms (lifetime straps, 2 years tracker, +1 year registered) | 2 |
| `/returns` | 60-day returns, how to start a return | 2 |
| `/track` | Order tracking (AfterShip or Shopify order status) | 2 |
| `/help` | Help center: setup, charging, strap swap, syncing, FAQ | 2 |
| `/about` | Founder story, team photos, company address | 2 |
| `/contact` | Contact form, email, phone/text, business address | 2 |
| `/privacy`, `/terms`, `/accessibility` | Legal | 2 |
| `/cart` | Cart drawer (not a page), checkout handoff | 2 |
| `/fr-ca/*` | French (Canada) locale | 4 (before Canada launch) |

---

## 4. Page specifications

### 4.1 Home `/`

Sections in order. Each section is its own component in `components/home/`.

1. **Announcement bar**: "Pre-order now, ships Nov 18 · Free US shipping · 60-day returns". Content from CMS.
2. **Header**: logo, nav (Band, Straps, App, No Subscription, Help), cart icon with count. Becomes compact and blurred on scroll.
3. **Hero (cinematic)**:
   - Full-bleed muted autoplay loop video (6-10 s), poster image first (LCP element), video loads after.
   - Headline: "Everything you want to track. Nothing to pay monthly."
   - Subline: "Joova Band. $49.99. No subscription. Ever."
   - CTAs: "Pre-order now" (primary coral), "Watch the film" (opens full video modal).
   - Trust row: "3 straps in every box · 60-day returns · 2-year warranty".
4. **Promise strip**: three large statements animating in: No subscription. Ever. / 3 straps in every box / Lifetime strap warranty.
5. **Scroll story: "A day with Joova"** (GSAP pinned section, 4 steps: Morning readiness, Active day, Evening wind-down, Sleep). Each step: short copy, phone app screen, band close-up. Background shifts from light to dark as the day moves into night.
   - Feature list must match the factory spec sheet. Use placeholders until confirmed: `[CONFIRM: sensors and metrics from spec sheet]`.
6. **Color picker (interactive)**: 5 launch versions as swatches. Selecting changes the large product image (and later the 3D model). Show name, price, "In stock / Pre-order" status from Shopify. CTA "Add to cart".
   - Launch versions (woven loop, graphite tracker, silver buckle): Black, Blue, Green, Orange, Red. Product images: `assets/band-images/`.
7. **"3 straps in every box"**: exploded view of the box contents (image sequence or 3D), strap swap video loop (10 s).
8. **No-subscription calculator (teaser)**: slider "Years of use: 1-5"; shows "Joova: $49.99 total" vs "A typical $X/month subscription: $Y". The monthly figure is a user-editable input with a default the team confirms; label it "example". Link to `/no-subscription`.
9. **App preview**: phone mockup with auto-cycling screens (sleep, activity, heart rate, trends). Badges: App Store, Google Play (live links after app approval). "Works with Apple Health and Google Health Connect" `[CONFIRM]`.
10. **Social proof**: Judge.me star rating and review carousel (real reviews only, hidden until there are at least 10); creator video wall (vertical videos, click to play with sound).
11. **Trust grid**: 60-day returns · Lifetime strap warranty · 2-year tracker warranty · Replacement ships first · US-based support · Secure checkout (Shop Pay, Apple Pay, PayPal). Each links to its policy page.
12. **FAQ** (accordion, from CMS): Does it need a subscription? Which phones? Battery life? Water resistance? Sizes? Shipping? Returns? Warranty? Data privacy?
13. **Final CTA**: large product shot, price, "Pre-order now".
14. **Footer**: links, newsletter signup (Klaviyo), social icons (@joova on all platforms), payment icons, company legal name and US address, "Also on Amazon and TikTok Shop" links.

**Phase 1 variant (waitlist)**: sections 3 (image hero instead of video), 4, 6 (display only), 11, 12, footer; hero CTA "Join the waitlist, get $10 off".

### 4.2 Product page `/band`

- Left: media gallery (images, 360 spin or 3D model, videos). Swipe on mobile, zoom on desktop.
- Right: title, star rating (when available), price, "No subscription. Ever." badge, color selector (swatches with names), size note (strap fits wrist range `[CONFIRM]`), quantity, **Add to cart**, Shop Pay express button, delivery estimate ("Ships Nov 18" during pre-order), trust bullets.
- Below: What's in the box, Specs table (from Shopify metafields, `[CONFIRM]` values), App section, Compare (Joova vs typical subscription tracker: price model only, factual, no competitor trademarks in images), Reviews, FAQ.
- **Sticky buy bar** on mobile after scrolling past the main button.
- Bundles (Phase 2+): Couple pack (2 bands, $89.99), Holiday bundle (band + 5 straps). Implemented as Shopify products or bundles.
- Structured data: `Product` JSON-LD with `Offer` (price, currency, availability). Add `AggregateRating` **only** from real Judge.me data.

### 4.3 Straps `/straps`

- Grid of strap products (color, material filters). Quick add to cart.
- Phase 2: extra woven loops in Black, Blue, Green, Orange, Red; more colors and materials later.

### 4.4 App `/app`

- Screen-by-screen tour (phone mockups), privacy promise ("Your data is stored in the US and never sold"), account deletion note, store badges, supported phones `[CONFIRM]`.
- Note: custom features come in a later phase; the page must be easy to update from the CMS.

### 4.5 No subscription `/no-subscription`

- Full calculator (years slider, editable monthly price input with a clearly labeled example default).
- The written promise: "Every feature in the Joova app is free. We will never charge a monthly fee for features you bought with your band." Links to Terms.

### 4.6 Policy and support pages

- `/warranty`, `/returns`: plain English, "How to claim in 3 steps", start-a-return form (Shopify returns or Loop Returns), effective date at top.
- `/track`: AfterShip embed or order number + email lookup.
- `/help`: searchable articles (from Sanity), short videos: setup, charging, strap swap, syncing. Live chat widget.
- `/about`: founder story, team photos (real), mission, company legal name and address.
- `/contact`: form (to Gorgias/email), support hours, reply time promise (24 h weekdays).

---

## 5. Video and media plan

Produced by Puzan with golden samples (from about Oct 12). Build components first with placeholder videos.

| # | Asset | Length | Where used | Notes |
| --- | --- | --- | --- | --- |
| V1 | Hero loop | 6-10 s | Home hero | Silent, seamless loop, no text burned in, 16:9 and 9:16 cuts |
| V2 | Brand film | 30-45 s | Hero "Watch the film" modal, YouTube | With music and captions |
| V3 | App demo | 15-20 s | App section, `/app` | Screen recording in a phone frame |
| V4 | Strap swap | 8-10 s | "3 straps" section, product page | Close-up, loop |
| V5 | Charging | 8 s | Help, product page | |
| V6 | Day-to-night story clips | 4 x 5 s | Scroll story | Morning, active, evening, sleep |
| V7 | Creator videos (UGC) | 15-60 s | Social proof wall, reviews | Vertical 9:16, with creator permission in writing |
| P1 | Product photos | | Everywhere | White background (Amazon), lifestyle on diverse wrists and skin tones, all 5 versions, box and contents |
| P2 | 3D model (GLB) | | Configurator (Phase 3) | Ask factory for CAD; optimize to under 2 MB with Draco |

**Video delivery rules**

- Host on Mux; use `@mux/mux-player-react` or a custom `<video>` with HLS.
- Always set a `poster` (the poster is the LCP image for the hero).
- Autoplay only muted and `playsInline`; lazy-load below-the-fold videos when they near the viewport (IntersectionObserver).
- Provide captions (WebVTT) for any video with speech.
- With `prefers-reduced-motion`, show posters with a play button instead of autoplay.

---

## 6. Commerce integration (Shopify headless)

### 6.1 Shopify setup (Satya)

- [ ] Create Shopify store (Basic plan) with the Joova domain for checkout (`shop.joova.xxx` or Shopify default until DNS is ready).
- [ ] Products: Joova Band (5 color variants: Black, Blue, Green, Orange, Red), straps, bundles. Add metafields: `specs`, `in_the_box`, `swatch_hex`, `badge`.
- [ ] Pre-order: enable "continue selling when out of stock" with a clear pre-order message, or use Shopify's pre-order selling plans / a pre-order app. Show ship date everywhere.
- [ ] Payments: Shopify Payments, Shop Pay, Apple Pay, Google Pay, PayPal. Optional buy-now-pay-later (Shop Pay Installments / Klarna / Afterpay).
- [ ] Taxes: enable US sales tax collection; Canada later.
- [ ] Shipping: free US shipping on bands; set rates for straps.
- [ ] Create a **Headless** sales channel and Storefront API access token.
- [ ] Install Judge.me, Klaviyo, AfterShip, returns app.

### 6.2 Code

- `lib/shopify/client.ts`: Storefront API client (GraphQL), typed with GraphQL Codegen.
- `lib/shopify/queries/*.ts`: product by handle, collection, cart create/add/update/remove, cart by id.
- Cart stored by `cartId` in a cookie; server actions for cart mutations; optimistic UI in the cart drawer.
- Checkout: redirect to `cart.checkoutUrl`.
- Revalidation: Shopify webhooks (product update, inventory update) hit `/api/revalidate` to refresh cached pages (tag-based revalidation).
- Inventory/pre-order status from `availableForSale` and a `preorder` metafield.

### 6.3 Environment variables (`.env.local`, never commit)

```
SHOPIFY_STORE_DOMAIN=
SHOPIFY_STOREFRONT_ACCESS_TOKEN=
SHOPIFY_REVALIDATION_SECRET=
SANITY_PROJECT_ID=
SANITY_DATASET=production
SANITY_API_READ_TOKEN=
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
KLAVIYO_PUBLIC_KEY=
KLAVIYO_WAITLIST_LIST_ID=
JUDGEME_PUBLIC_TOKEN=
JUDGEME_SHOP_DOMAIN=
NEXT_PUBLIC_GA4_ID=
NEXT_PUBLIC_META_PIXEL_ID=
META_CAPI_TOKEN=
NEXT_PUBLIC_TIKTOK_PIXEL_ID=
NEXT_PUBLIC_SITE_URL=
```

---

## 7. Marketing, tracking and email

- **Waitlist (Phase 1)**: form (email + optional phone for SMS with separate consent) to Klaviyo list via server route `/api/waitlist` (validate with Zod, rate-limit, honeypot field). Success state: "You're in. $10 off code arrives by email."
- **Klaviyo flows** (Puzan): Welcome/waitlist series, pre-order confirmation, abandoned cart, browse abandonment, post-purchase setup tips (day 1, 7, 30), review request (day 14), back in stock.
- **Events to track** (GA4 + Meta + TikTok): `view_item`, `select_color`, `add_to_cart`, `begin_checkout`, `purchase` (from Shopify), `sign_up_waitlist`, `play_video` (hero film), `calculator_used`.
- **UTM handling**: persist UTM params in a cookie and pass to Shopify cart attributes for attribution.
- **Consent**: marketing pixels load only after consent; essential cookies only by default where required.
- **Amazon / TikTok links**: "Also available on Amazon" button uses Amazon Attribution tags.

---

## 8. SEO and content

- Unique `title` and `description` per page (Next.js Metadata API); Open Graph + Twitter images (generated with `next/og` using brand fonts).
- JSON-LD: `Organization`, `WebSite`, `Product` + `Offer`, `FAQPage`, `BreadcrumbList`.
- `sitemap.xml`, `robots.txt`, canonical URLs, clean URLs.
- Target phrases: "fitness tracker no subscription", "screenless fitness tracker", "Whoop alternative without subscription" (only in honest comparison content), "sleep tracker band".
- Blog (Phase 4, Sanity): setup guides, sleep and recovery tips (wellness only), comparison guides with dated, sourced facts.

---

## 9. Accessibility, performance, security, legal

### Accessibility (WCAG 2.2 AA)
- Semantic HTML, one `h1` per page, landmarks, skip link.
- All interactive elements keyboard reachable with visible focus rings.
- Color swatches have text labels and `aria-pressed`; do not rely on color alone.
- Video: captions, pause/stop controls for any autoplaying motion longer than 5 s.
- Run axe-core in Playwright on every page in CI.

### Performance budget
- JS per route under 170 KB gzipped (excluding 3D, which loads only on interaction).
- Hero poster image under 200 KB (AVIF), `priority` loading; fonts preloaded via `next/font`.
- Lazy-load GSAP scroll stories, 3D viewer, review widgets and chat widget.
- Third-party scripts via `next/script` with `strategy="lazyOnload"` or after consent.

### Security
- Secrets only in server code/env; Storefront token is public-scope only.
- Rate-limit form routes; validate all input with Zod; Content Security Policy headers; HTTPS only.

### Legal and compliance (have a lawyer review copy before launch)
- Wellness claims only; no medical claims (FDA general wellness guidance).
- Warranty page: clear written terms (what is covered, duration, how to claim, who pays shipping).
- Reviews: only genuine reviews; disclose incentives; creator content marked as sponsored where paid (FTC).
- Pricing: no fake "was" prices or fake countdown timers.
- Privacy policy covering health-related data, CCPA/CPRA rights, cookie policy; accessibility statement.
- Canada (Phase 4): French versions of product and policy content; CAD pricing.

---

## 10. Project structure

```
joova-web/
  app/
    (marketing)/
      page.tsx                 # Home
      band/page.tsx
      straps/page.tsx
      app/page.tsx
      no-subscription/page.tsx
      reviews/page.tsx
      about/page.tsx
      help/[[...slug]]/page.tsx
      warranty/page.tsx
      returns/page.tsx
      track/page.tsx
      contact/page.tsx
      privacy/page.tsx
      terms/page.tsx
    api/
      waitlist/route.ts
      revalidate/route.ts
      contact/route.ts
    layout.tsx
    globals.css
    opengraph-image.tsx
    sitemap.ts
    robots.ts
  components/
    layout/ (Header, Footer, AnnouncementBar, CartDrawer, StickyBuyBar)
    home/ (Hero, PromiseStrip, DayStory, ColorPicker, BoxContents, SubscriptionCalculator, AppPreview, SocialProof, TrustGrid, FAQ, FinalCTA)
    product/ (Gallery, VariantSwatches, AddToCart, SpecsTable, InTheBox, Band3DViewer)
    media/ (VideoPlayer, VideoModal, UGCWall, PhoneMockup)
    ui/ (Button, Badge, Accordion, Dialog, Sheet, Input, Toast)
  lib/
    shopify/ (client.ts, queries/, types.ts, cart.ts)
    sanity/ (client.ts, queries.ts, schemas/)
    analytics/ (events.ts, consent.ts)
    klaviyo.ts
    utils.ts
  content/                     # Phase 1 local JSON/MDX before Sanity
  public/ (images, posters, icons)
  tests/ (e2e/, unit/)
  .cursor/rules/joova.mdc
```

---

## 11. Build phases and tasks

### Phase 0: Setup (Day 1)
- [ ] Create repo `joova-web`, Next.js + TypeScript strict + Tailwind v4 + ESLint/Prettier + Husky.
- [ ] Add design tokens, fonts, base layout, `Button`, `Container`, `Section` components.
- [ ] Connect Vercel; preview deployments per branch; add domain.
- [ ] Add `.cursor/rules/joova.mdc` (section 12).
- [ ] GitHub Actions: typecheck, lint, unit tests, Playwright smoke + axe.

**Accept when:** empty site deploys to Vercel with brand fonts and colors; CI green.

### Phase 1: Waitlist landing (by Oct 10)
- [ ] Home (waitlist variant): hero with image, promise strip, color swatches (display), trust grid, FAQ, footer.
- [ ] `/api/waitlist` to Klaviyo (Zod, honeypot, rate limit), success and error states.
- [ ] Privacy and terms pages (lawyer-reviewed text from the team).
- [ ] GA4 + Meta + TikTok pixels behind consent banner; `sign_up_waitlist` event.
- [ ] Open Graph image, sitemap, robots.

**Accept when:** mobile Lighthouse 90+ on all four scores; signup lands in Klaviyo; events visible in GA4 DebugView.

### Phase 2: Store and full site (by Oct 15 for pre-orders, rest by Nov 5)
- [ ] Shopify Storefront client, typed queries, cart (create/add/update/remove), cart drawer, checkout handoff.
- [ ] `/band` product page with gallery, swatches, Add to cart, Shop Pay button, sticky buy bar, specs, in the box.
- [ ] Pre-order messaging tied to product metafield; ship date shown in cart and product page.
- [ ] `/straps`, `/app`, `/no-subscription` (calculator), `/warranty`, `/returns`, `/track`, `/help`, `/about`, `/contact`.
- [ ] Sanity studio with schemas: `homePage`, `faq`, `helpArticle`, `pressItem`, `ugcVideo`, `announcement`.
- [ ] Home full version: scroll story (GSAP), color picker wired to Shopify, app preview, trust grid, FAQ from CMS.
- [ ] Webhook revalidation from Shopify.
- [ ] Full analytics events; UTM to cart attributes.

**Accept when:** a test order completes end-to-end in Shopify test mode from every CTA; pre-order date shows everywhere; Playwright E2E covers browse, pick color, add to cart, checkout redirect; axe shows no serious issues.

### Phase 3: Cinematic polish and media (Oct 16 to Nov 10)
- [ ] Replace placeholders with real photos and Mux videos (V1-V6).
- [ ] Hero video with poster-first loading; film modal with captions.
- [ ] Box contents animation; strap swap loop.
- [ ] 3D band viewer / configurator (lazy-loaded, fallback to images). Only if GLB model is ready; otherwise use a 36-frame 360 image spin.
- [ ] Judge.me reviews (hidden until 10+ reviews) and UGC video wall.
- [ ] Micro-interactions: button hovers, add-to-cart confirmation, swatch transitions; reduced-motion versions of all.
- [ ] Live chat widget (lazy).

**Accept when:** mobile LCP under 2.5 s with video hero; no layout shift from video or reviews; reduced-motion mode verified; content editable by Puzan in Sanity.

### Phase 4: Launch hardening (Nov 10 to Nov 17) and after
- [ ] Load test (Vercel + Shopify handle traffic; check rate limits).
- [ ] Final copy and legal review; all `[CONFIRM]` placeholders replaced.
- [ ] Switch hero CTA from "Pre-order" to "Buy now" on Nov 18 (CMS toggle, no deploy).
- [ ] Black Friday banner and bundles ready (CMS toggles).
- [ ] 404 and 500 pages; uptime monitoring; error tracking (Sentry).
- [ ] After launch: A/B test hero headline and CTA (Vercel Edge Config or a lightweight flag tool), French (Canada) locale with `next-intl` before January, blog.

**Accept when:** launch checklist (section 13) fully checked.

---

## 12. Cursor rules file (`.cursor/rules/joova.mdc`)

```
---
description: Joova website coding rules
globs: ["**/*.{ts,tsx,css,md}"]
alwaysApply: true
---
- Stack: Next.js App Router, TypeScript strict, Tailwind v4 tokens from globals.css, Radix/shadcn primitives, Motion, GSAP ScrollTrigger (client components only), Shopify Storefront API, Sanity, Mux.
- Server Components by default; add "use client" only for interactivity. Keep client bundles small; dynamic-import GSAP, 3D and third-party widgets.
- Use design tokens (var(--joova-*)) and the type scale; never hard-code new colors.
- Every image uses next/image with width/height or fill + sizes. Every video has a poster and respects prefers-reduced-motion.
- Accessibility first: semantic elements, labels, focus states, aria where needed; swatches have text labels.
- Copy rules: wellness language only, no medical claims; never fabricate reviews, ratings, stock counts or urgency; prices and promises come from Shopify/CMS, not hard-coded.
- Checkout always via Shopify cart.checkoutUrl. Never handle card data.
- Validate all API input with Zod; secrets only on the server.
- Write Playwright tests for new user flows and keep axe checks passing.
- Mark unknown product facts as [CONFIRM: ...] instead of guessing.
```

---

## 13. Launch checklist

- [ ] All five variants purchasable; correct prices; pre-order to in-stock switch works.
- [ ] Shop Pay, Apple Pay, Google Pay, PayPal tested on mobile and desktop.
- [ ] Taxes and free shipping correct for several US states.
- [ ] Order confirmation, shipping and tracking emails branded.
- [ ] Warranty, returns, privacy, terms, accessibility pages live and linked in footer and checkout.
- [ ] App Store and Google Play links live.
- [ ] Amazon and TikTok Shop links correct.
- [ ] Analytics: purchase event fires once with correct value in GA4, Meta, TikTok.
- [ ] Klaviyo flows on; waitlist launch email scheduled for Nov 18.
- [ ] Lighthouse mobile 90+; LCP under 2.5 s; axe clean.
- [ ] Social links point to @joova accounts; OG images look right when shared.
- [ ] Support inbox and chat staffed for launch week.

---

## 14. Open items for the team

- `[CONFIRM]` Final domain name.
- `[CONFIRM]` Factory spec sheet: sensors, metrics, battery life, water rating, wrist size range, charging method.
- `[CONFIRM]` App features at launch and supported phones; Apple Health / Google Health Connect support.
- `[CONFIRM]` Example monthly subscription price used in the calculator (label as example; cite source and date if a real product is named).
- `[CONFIRM]` Company legal name and US address for footer.
- Lawyer review: warranty, returns, privacy, terms, comparison copy.
