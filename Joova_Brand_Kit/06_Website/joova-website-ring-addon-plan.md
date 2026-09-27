# Joova Ring: Website Add-on Plan

> Add-on to `joova-website-implementation-plan.md`. Read that file first; everything there (stack, design system, rules, quality bars) still applies. This file only covers what changes or is added to sell the **Joova Ring** (smart health-tracking ring) alongside the **Joova Band**.

---

## 0. Summary

| Item | Value |
| --- | --- |
| Product | **Joova Ring**: smart health-tracking ring, no subscription |
| Price | **$119** target `[CONFIRM after factory quote]` |
| Promise | **"No subscription. Ever."** + **"Free sizing kit first"** + **2-year warranty** |
| Launch finishes | **Silver, Matte Black, Gold** (Rose Gold and Brushed Silver added later) |
| Sizes | US **6 to 12** (Joova sizes; confirmed with the sizing kit) `[CONFIRM factory size chart]` |
| Timing | Ring launches **after** the band. The website shows the ring as **"Coming soon"** first, then pre-orders with sizing kit. Dates `[CONFIRM]` once the ring factory, patent check and first order are done |
| Owners | Satya (build), Puzan (content, video), Nabin (sizing kit fulfillment), Suman (ring stock dates) |

### Goals
1. Turn the site from a one-product page into a **Joova family** site (Band + Ring) without slowing it down.
2. Collect a ring waitlist from day one of the band launch.
3. Remove the biggest ring worry, **"what size am I?"**, with a smooth sizing-kit flow that keeps returns low.
4. Sell Band + Ring together (bundle and cart cross-sell).

---

## 1. Rollout stages

| Stage | What goes live | Trigger |
| --- | --- | --- |
| **R1. Coming soon** | Ring teaser on Home, `/ring` coming-soon page, ring waitlist (Klaviyo list "Ring waitlist") | Can ship with the band launch (Nov 18) |
| **R2. Pre-order** | Full `/ring` product page, sizing kit flow, Shopify ring products, Band + Ring bundle | Ring factory confirmed, patent review passed, delivery date known |
| **R3. Premium media** | Real ring photos and macro videos, 3D ring viewer, AR "view on your hand" (optional) | Golden samples in hand |
| **R4. In stock** | Switch to "Buy now", reviews, Rose Gold and Brushed Silver finishes | Stock at Amazon / warehouse |

A single CMS field (`ringStatus`: `hidden | comingSoon | preorder | live`) controls which stage shows, so switching needs no deploy.

---

## 2. Design additions

### 2.1 Ring finish tokens (add to `globals.css`)

```css
:root {
  --ring-silver: #C9CCD1;
  --ring-matte-black: #2A2B2F;
  --ring-gold: #D4B26A;
  --ring-rose-gold: #D4A08C;       /* later */
  --ring-brushed-silver: #B8BCC2;  /* later */
}
```

- Swatches for metal finishes use a subtle radial gradient (highlight to base) so they read as metal, and always show the finish name as text.
- Ring imagery: macro, jewelry-style photography on warm paper and dark ink backgrounds; soft reflections. Night / sleep scenes suit the ring story.

### 2.2 Design caution
- Ring shape, sensor layout and imagery must come from **our factory's design** after the patent review. Do not style photos or renders to imitate other ring brands' signature looks.
- No competitor logos or product images anywhere on the site.

---

## 3. Site map changes

| Route | Change |
| --- | --- |
| Header nav | `Band` · `Ring` · `Straps` · `App` · `No Subscription` · `Help`. On desktop, a mega menu "Shop" with both product cards |
| `/` Home | Add a **"The Joova family"** section (Band + Ring cards) and a ring teaser in the scroll story (Sleep step) |
| `/ring` | New product page (coming soon, then full product page) |
| `/ring/sizing` | How sizing works, sizing kit, size guide, FAQ |
| `/ring/confirm-size` | Size confirmation form for customers who ordered "size later" |
| `/compare` | **Band or Ring?** side-by-side chooser (own products only) |
| `/app` | Show both devices work in the same Joova app `[CONFIRM same app supports ring]` |
| `/warranty`, `/returns`, `/help` | Add ring sections (sizing exchanges, ring care, charging) |
| `/bundles/band-ring` (or bundle product) | Band + Ring bundle |

---

## 4. Page specifications

### 4.1 Home additions
1. **Joova family section** (after the color picker): two large cards, Band ($49.99) and Ring (price or "Coming soon"), each with one line on who it suits:
   - Band: "Easy to wear, swap straps, great for workouts."
   - Ring: "Barely there, made for sleep and all-day wear."
2. **Scroll story, Sleep step**: short line "Prefer nothing on your wrist at night? Meet Joova Ring," linking to `/ring`.
3. Announcement bar can switch to ring messages via CMS.

### 4.2 `/ring` in "Coming soon" (R1)
- Hero: dark background, macro ring image slowly rotating (image sequence or 3D if ready), headline **"Joova Ring. No subscription. Ever."**, sub **"Coming soon. Join the list for early access and launch pricing."**
- Waitlist form (email; optional preferred finish; optional "I already know my size" + size). Posts to `/api/waitlist` with `list=ring` and properties `finish`, `size`.
- Three promise tiles: No subscription · Free sizing kit first · 2-year warranty.
- FAQ: When does it launch? Price? Which phones? Does it work with the Band app? Water resistance `[CONFIRM]`? Battery `[CONFIRM]`?

### 4.3 `/ring` full product page (R2+)
- **Gallery**: finish-specific images, macro video loop, 3D viewer (R3), AR button on supported phones (R3, optional).
- **Buy box**:
  - Title, price, "No subscription. Ever." badge, rating (only when real reviews exist).
  - **Finish selector**: Silver, Matte Black, Gold (later Rose Gold, Brushed Silver).
  - **Size selector with two paths** (radio cards):
    1. **"Send me a free sizing kit first" (recommended)**: order now, we ship the kit, you confirm your size, then we ship the ring. Selects the `Size later` variant.
    2. **"I know my Joova size"**: pick 6 to 12. Note: "Joova sizes can differ from jewelry sizes; if unsure, choose the sizing kit."
  - Add to cart, Shop Pay button, delivery message per path ("Sizing kit ships in 1 to 2 days; ring ships within 2 business days after you confirm your size").
  - Trust bullets: 60-day returns, free size exchange within 60 days, 2-year warranty.
- **Below the fold**: what it tracks (wellness wording only, `[CONFIRM from spec sheet]`), materials and finish care, charging, in the box, specs table (from metafields), sleep story, app screens, reviews, FAQ.
- **Sticky buy bar** on mobile.
- **Gift option**: "Buying as a gift? Choose the sizing kit: they pick their size." Gift message field (cart attribute).

### 4.4 `/ring/sizing`
- Visual 3-step: 1. Get your free kit · 2. Wear the sample ring for 24 hours on your chosen finger (index finger recommended `[CONFIRM factory advice]`) · 3. Confirm your size online.
- Size chart table (Joova size, inner diameter mm, inner circumference mm) `[CONFIRM factory chart]`.
- Tips: measure at the end of the day, fingers swell in heat, snug but not tight, should slide over the knuckle.
- Video: sizing kit unboxing and how to try (30 s).
- No printable paper sizer (inaccurate for smart rings).

### 4.5 `/ring/confirm-size` (sizing kit customers)
- Form: order number + email + chosen size + finger. Validate with Zod; rate-limit.
- Server route `/api/ring/confirm-size`:
  - Looks up the order via **Shopify Admin API** (server-only token) and checks email matches.
  - Writes the size to the order (order note / metafield `ring_size`) and adds tag `size-confirmed`.
  - Sends a confirmation email (Klaviyo event `Ring Size Confirmed`), notifies ops (Nabin) via email or Slack webhook.
- Success page: "Got it. Your Joova Ring in size X ships within 2 business days."
- Klaviyo reminder flow if no size confirmed 5 and 10 days after the kit is delivered.

### 4.6 `/compare`: Band or Ring?
- Two columns, our products only: form factor, where you wear it, best for, strap swapping vs finishes, battery `[CONFIRM]`, water rating `[CONFIRM]`, price, subscription (none for both).
- Short quiz (3 questions: "Do you want something for workouts?", "Do you want to wear it at night?", "Do you like changing looks?") suggesting Band, Ring, or both.
- CTA to each product and to the bundle.

---

## 5. Commerce (Shopify) additions

### 5.1 Products and variants
- [ ] **Joova Ring** product. Options: `Finish` (Silver, Matte Black, Gold) x `Size` (Size later, 6, 7, 8, 9, 10, 11, 12) = 24 variants.
  - `Size later` variants: sellable during pre-order; inventory tracked against total finish stock.
- [ ] **Joova Ring Sizing Kit** product: free (price $0), not sold alone; added automatically as a cart line (or via Shopify Functions / bundle) when a `Size later` variant is in the cart. Alternatively, fulfill the kit manually from the order tag. Pick the simplest option that works with the chosen fulfillment app.
- [ ] Metafields (ring): `specs`, `in_the_box`, `finish_hex`, `size_chart` (JSON), `badge`, `preorder_ship_date`.
- [ ] **Bundle**: Band + Ring (price `[CONFIRM]`, e.g. $159.99) via Shopify Bundles app; bundle keeps the ring's sizing choice.
- [ ] Order tags: `ring-size-later`, `size-confirmed`, `sizing-kit-shipped` for the ops team.

### 5.2 Code
- `lib/shopify/queries/ring.ts`: product by handle with both options, selling plans / pre-order metafield.
- `lib/shopify/admin.ts`: server-only Admin API client (order lookup, update note/metafield, tags). Token env var `SHOPIFY_ADMIN_ACCESS_TOKEN` with minimal scopes (`read_orders`, `write_orders`).
- `components/product/ring/`: `FinishSelector`, `SizePathSelector`, `SizeGrid`, `RingGallery`, `Ring3DViewer`, `SizingSteps`, `SizeChart`.
- Cart drawer: if the cart has a Band and no Ring (and the ring is live), show a small "Complete the set" suggestion, and vice versa. Max one suggestion; dismissible.
- Analytics events: `view_item` (ring), `select_finish`, `select_size_path`, `select_size`, `ring_waitlist_signup`, `ring_size_confirmed`, `compare_quiz_result`.

### 5.3 New environment variables

```
SHOPIFY_ADMIN_ACCESS_TOKEN=
KLAVIYO_RING_WAITLIST_LIST_ID=
OPS_NOTIFY_WEBHOOK_URL=
```

---

## 6. Media plan (ring)

| # | Asset | Length | Where used | Notes |
| --- | --- | --- | --- | --- |
| RV1 | Ring hero macro loop | 6-8 s | `/ring` hero | Slow rotation, light sweeping over the metal, silent loop |
| RV2 | Ring film | 20-30 s | Film modal, social | Day to night, sleep focus, captions |
| RV3 | Sizing kit how-to | 30 s | `/ring/sizing`, emails | Unboxing, try on, confirm online |
| RV4 | Charging | 6-8 s | Product page, help | |
| RV5 | Band + Ring together | 10 s | Family section, bundle | Both devices, same app |
| RP1 | Photos | | Everywhere | Each finish, on hands of different ages and skin tones, macro details, box contents, sizing kit |
| RP2 | 3D model (GLB + USDZ) | | 3D viewer, AR | From factory CAD; PBR metal materials; under 1.5 MB with Draco; USDZ for iPhone AR Quick Look |

3D and AR (R3, optional):
- 3D viewer with React Three Fiber (environment map for realistic metal; finish swaps change material color/roughness), lazy-loaded on interaction, image fallback.
- AR via `<model-viewer>` (Google) with `ar` + `ios-src` for Quick Look; show the button only on supported devices.

---

## 7. Copy, legal and trust

- Wellness language only (sleep, activity, heart-rate trends, temperature trends if supported `[CONFIRM]`). No medical or diagnostic claims.
- State clearly: the ring and the band use the Joova app, free, no subscription `[CONFIRM app support]`.
- Returns: 60-day returns; free size exchange within 60 days (define process on `/returns`).
- Warranty: 2 years on the ring (define what is covered, e.g. not cosmetic scratches) on `/warranty`.
- Care page: avoid contact with hard surfaces for polished finishes, how to clean, charging safety.
- Reviews: show ring reviews separately from band reviews; never merge ratings across products.

---

## 8. Tasks by stage

### R1. Coming soon (ship with band launch)
- [ ] Add `ringStatus` field to Sanity `siteSettings`.
- [ ] Nav + mega menu with Band and Ring cards.
- [ ] Home "Joova family" section and Sleep-step teaser.
- [ ] `/ring` coming-soon page with waitlist (Klaviyo list `Ring waitlist`, finish and size properties).
- [ ] FAQ entries for the ring in Sanity.

**Accept when:** ring waitlist signups reach Klaviyo with properties; Lighthouse scores unchanged (90+); nothing ring-related shows when `ringStatus = hidden`.

### R2. Pre-order
- [ ] Shopify ring product (24 variants), sizing kit product, metafields, tags, bundle.
- [ ] `/ring` product page with finish selector, two sizing paths, size grid, pre-order messaging.
- [ ] `/ring/sizing` and `/ring/confirm-size` + `/api/ring/confirm-size` (Admin API, Zod, rate limit, ops notification).
- [ ] Klaviyo flows: ring pre-order confirmation, kit shipped, size reminders (day 5, day 10), size confirmed, ring shipped.
- [ ] Cart cross-sell (Band to Ring, Ring to Band).
- [ ] `/compare` page and quiz.
- [ ] Update `/returns`, `/warranty`, `/help` with ring content.
- [ ] Playwright E2E: ring with sizing kit to checkout; ring with known size to checkout; confirm-size form happy path and wrong-email path.

**Accept when:** test orders for both sizing paths complete in Shopify test mode; confirm-size updates the order and notifies ops; axe clean.

### R3. Premium media
- [ ] Real photos and videos (RV1-RV5).
- [ ] 3D viewer with finish switching; AR button where supported.
- [ ] Performance check: `/ring` mobile LCP under 2.5 s; 3D loads only on interaction.

### R4. In stock and growth
- [ ] Switch `ringStatus` to `live`; "Buy now" copy; ship times updated.
- [ ] Reviews (Judge.me) on `/ring`, hidden until 10+ ring reviews.
- [ ] Add Rose Gold and Brushed Silver finishes (Shopify + swatches + images).
- [ ] A/B test sizing path default (kit first vs known size) and measure return rates.

---

## 9. Cursor rules additions (append to `.cursor/rules/joova.mdc`)

```
- Multi-product: Band and Ring share components where possible (Gallery, StickyBuyBar, TrustGrid, FAQ); product-specific parts live in components/product/band and components/product/ring.
- Ring visibility is controlled only by the Sanity field ringStatus (hidden | comingSoon | preorder | live). Never hard-code launch states or dates.
- Ring sizing: the sizing-kit path is the recommended default; always explain that Joova sizes may differ from jewelry sizes.
- Shopify Admin API calls are server-only (lib/shopify/admin.ts); never expose the Admin token to the client.
- Ring ratings and reviews are never merged with Band ratings.
- Unknown ring specs are marked [CONFIRM: ...].
```

---

## 10. Open items

- `[CONFIRM]` Ring price and bundle price.
- `[CONFIRM]` Ring factory spec sheet: sensors, metrics, battery life, water rating, materials, charging dock.
- `[CONFIRM]` Size chart (Joova size to inner diameter) and recommended finger.
- `[CONFIRM]` Ring works in the same Joova app as the band.
- `[CONFIRM]` Ring launch and pre-order dates (after factory order and patent review).
- `[CONFIRM]` Sizing kit cost and who ships it (Nabin from US stock recommended).
- Lawyer review: ring claims, warranty exclusions (scratches), size-exchange terms.
