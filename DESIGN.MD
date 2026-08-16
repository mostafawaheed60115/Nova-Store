---
name: laptop-store-design
description: Design direction for a budget-friendly, approachable laptop/computer online store. Locks the brand's color palette, defines accessible derived tokens, and gives concrete, non-generic UI patterns for hero, PLP, PDP, spec comparison, and checkout. Use this before styling any page or component in the React storefront.
---

# Laptop Store Design Skill

**Positioning:** budget-friendly & approachable. The customer is not a spec-sheet expert — they're a student, a parent, a first jobber — trying to buy a laptop without getting overwhelmed or ripped off. Every design decision should reduce intimidation and build trust, not project luxury or gamer intensity. This is the opposite brief from Apple's minimal-flex or Razer's RGB-maximalism — closer in spirit to how a good local electronics shop clerk treats you: friendly, plain-spoken, honest about trade-offs.

That positioning **is** the differentiator. Most budget-tech sites default to generic "SaaS blue" — because the palette below is blue-led, the single biggest risk is landing there by accident. Section 2 exists specifically to prevent that.

---

## 1. Locked palette — do not add or substitute hues

These 8 colors are final. Everything else in this doc (buttons, states, tints) is *derived* from them — never introduce a new hue without deriving it from this set first.

| Token | Hex | Role |
|---|---|---|
| `prussian-blue` | `#162944` | Primary text, headers, dark surfaces, footer |
| `blue-bell` | `#3399D4` | Primary brand blue — links, secondary actions, icons |
| `blue-bell-2` | `#34A2DF` | Near-identical to blue-bell — **retire this as a separate design decision**, use only as its hover/focus state (see §1.2) |
| `alice-blue` | `#EAF1F9` | Page background, card surfaces |
| `steel-blue` | `#76A4C4` | Muted UI: disabled states, dividers, secondary icons |
| `powder-blue` | `#B8C7DD` | Borders, input outlines, subtle chips |
| `petal-frost` | `#E6D1DB` | Soft accent surface — badges, highlight backgrounds, warmth against all the blue |
| `light-coral` | `#EB838D` | The one "alive" color — sale tags, wishlist/heart, primary CTA accent, urgency cues |

**Ratio guide (adapted 60/30/10):** ~60% `alice-blue`/white neutral surface, ~30% `prussian-blue` + `blue-bell` (text, structure, trust), ~10% `light-coral`/`petal-frost` (warmth, action, delight). If a page feels cold or corporate, you've under-used the last 10%. If it feels chaotic, you've over-used it.

### 1.1 Accessibility-checked pairings (WCAG contrast verified — use these, not eyeballed combos)

✅ **Safe for body text:**
- `prussian-blue` on `alice-blue` — 12.9:1
- `prussian-blue` on white — 14.6:1
- `prussian-blue` on `powder-blue` — 8.5:1
- `prussian-blue` on `petal-frost` — 10.1:1
- `prussian-blue` on `steel-blue` — 5.5:1

⚠️ **Large text / bold labels / icons only (≥18px or ≥14px bold), never small body copy:**
- white on `blue-bell` — 3.16:1
- `blue-bell` on white — 3.16:1 (as a link/label, not a paragraph)

❌ **Never use as text — fails contrast even at large sizes:**
- white on `blue-bell-2` — 2.85:1
- white on `light-coral` — 2.57:1
- `blue-bell` on `alice-blue` — 2.78:1
- `light-coral` on `alice-blue` — 2.26:1

### 1.2 Derived functional tokens (ready to paste)

These are mixes of the locked palette only — no foreign hues — solving the gaps above (buttons need a white-text-safe dark variant; coral needs a legible dark variant).

```css
:root {
  /* base */
  --color-ink: #162944;           /* prussian-blue */
  --color-surface: #EAF1F9;       /* alice-blue */
  --color-surface-white: #FFFFFF;
  --color-border: #B8C7DD;        /* powder-blue */
  --color-muted: #76A4C4;         /* steel-blue */

  /* primary (blue) button system */
  --color-primary: #3399D4;             /* blue-bell — default surface */
  --color-primary-hover: #34A2DF;       /* blue-bell-2 — gives it a real job: hover state */
  --color-primary-text-on: #162944;     /* dark text ON blue-bell surfaces (buttons, chips) */
  --color-primary-strong: #246B94;      /* shade — use when you need WHITE text at AA (dense CTAs, dark-mode buttons) */
  --color-primary-tint: #E0F0F9;        /* light wash — selected filters, hover rows */

  /* accent (coral) — sparingly: sale badges, wishlist, urgency, one hero CTA */
  --color-accent: #EB838D;              /* light-coral */
  --color-accent-strong: #A45C63;       /* shade — use for WHITE text at AA on coral buttons/badges */
  --color-accent-tint: #FCECEE;         /* badge backgrounds with prussian-blue text */

  /* warm neutral accent */
  --color-warm-surface: #E6D1DB;        /* petal-frost — promo banners, empty states, gift/bundle sections */
}
```

**Button rule of thumb:** default state = tint or base color with `prussian-blue` text; hover = one step darker/brighter; if the button must carry white text (e.g. a filled dark button in a dense toolbar), use `--color-primary-strong` or `--color-accent-strong`, never the raw base hex with white text.

### 1.3 State colors not in the palette (needed for stock/checkout, must harmonize)

The 8 colors don't include success/warning states you'll need for "In Stock," "Low Stock," form errors. Don't reach for pure `#00FF00`/`#FF0000` — it'll look bolted-on. Match the palette's muted, mid-saturation character:

- **Success** (in stock, order confirmed): `#4C9973` (muted sage — same lightness family as `steel-blue`)
- **Warning** (low stock, price drop ending): `#D69A4A` (muted amber — sits between `light-coral`'s warmth and the blues' restraint)
- **Error** (out of stock, form invalid): reuse `--color-accent-strong` (`#A45C63`) — it's already in-family and reads as "attention" without introducing pure red.

---

## 2. Anti-generic guardrails (read before building anything)

A blue-primary, budget-tech palette is exactly the profile that collapses into "generic SaaS/AI startup" by default. Watch for these specific tells and avoid them:

- **No blue-to-lighter-blue gradient hero backgrounds.** This is the single most common budget-tech default. If you want a gradient, restrict it to a small surface (a badge, an icon backdrop) and derive both stops from the locked palette — never a full-bleed hero gradient.
- **No all-corners-rounded-24px card grid with a drop shadow and an icon-on-top layout.** That's the templated SaaS-features-section look. If you use cards, vary the format: some full-bleed photo cards, some text-only, some with an asymmetric spec callout — not one repeating card component everywhere.
- **No generic stock photography of "diverse people smiling at laptops in a bright office."** For a budget/approachable brand, real product photography (angled 3/4 shots of the actual laptops, consistent lighting) reads as more trustworthy than lifestyle stock. Reserve lifestyle imagery for 1–2 hero moments max, and if you can't source real photography, favor simple product-only shots over stock people.
- **No single generic sans (Inter/Poppins/Manrope) doing every job with only weight changes.** See §3 — pair a display face with real character against a clean workhorse body face.
- **Don't default to a hamburger-and-search-bar-only header just because it's "clean."** Budget/approachable shoppers browse by category and price — a visible mega-nav or category rail with icons does more trust-building work than a minimal hidden nav.
- **The "product is the demo" pattern still applies at budget scale** — even without 3D/WebGL, let the PDP hero be a large, real, angled product photo with a spec strip beneath it, not a text block first.

---

## 3. Typography

Budget/approachable ≠ boring. The type should feel like a friendly explainer, not a spreadsheet.

- **Display face:** something with rounded terminals or warm humanist character for headlines and prices — e.g. *Sora*, *Plus Jakarta Sans*, or *Outfit* at a heavy weight. Avoid geometric-cold faces (pure Inter/Helvetica) for headlines — they push the "SaaS" read.
- **Body face:** a clean, highly legible workhorse for descriptions and spec text — *Inter*, *Public Sans*, or *IBM Plex Sans* at regular/medium. This is where legibility wins over personality — specs need to be scannable.
- **Utility/mono face** (optional but effective for this vertical): a monospace for exact specs (`16GB RAM`, `512GB SSD`, `1.4kg`) — *IBM Plex Mono* or *JetBrains Mono* at small size. Monospace numerals in spec rows read as "precise, no marketing spin," which builds trust with budget shoppers who are wary of upsell.
- **Scale:** don't default to 4 sizes. Use a real scale (e.g. 13 / 15 / 17 / 22 / 28 / 40 / 56px) so price, product name, and spec text are clearly differentiated at a glance on a crowded PLP grid.

---

## 4. Page-level patterns for this vertical

### Homepage / hero
Lead with the thesis, not a template hero. For "budget-friendly & approachable," the strongest honest hero is **"tell me what you need, we'll tell you what fits"** — a short guided-finder input ("What will you mostly use it for?") beats a generic "Shop Now" hero banner, because it's the actual value prop (removing spec-overwhelm) made interactive on load.

### Product Listing Page (PLP)
- Filters should be in plain English with the jargon in parentheses, not the reverse: "Great for everyday browsing (Intel i3 / 8GB RAM)" rather than just spec codes.
- Persistent **compare checkboxes** on cards — users comparing laptops frequently add-to-compare directly from the grid without opening a PDP. Keep a sticky "Comparing (2)" bar visible once 2+ items are selected.
- Price should show monthly/installment framing if you support it — critical trust signal for budget shoppers, more than the sticker price alone.
- Use `success`/`warning` tokens for stock state chips on the card itself, not buried on the PDP.

### Product Detail Page (PDP)
- Large real product photo (angled 3/4, consistent `alice-blue` or white backdrop across all products) — this consistency is what makes a catalog feel designed rather than dumped from a spreadsheet.
- **Spec table pattern:** checkmarks/dashes for feature presence, short phrases not paragraphs, most-decision-relevant specs (RAM, storage, screen, battery, weight) pinned above the fold; secondary specs (ports, materials) below an expandable "Full specs" disclosure. Keep product title + price + Buy button sticky as the user scrolls the spec table.
- **Signature element — the Plain-English Spec Translator** (see §6): this is the one place to spend your "boldness budget" on this page.
- If you offer configuration (RAM/storage tiers), reveal options progressively — don't show every axis (color, RAM, storage, warranty) at once. Price updates instantly and visibly on every change; never make the user hunt for the new total.

### Comparison tool
- Sticky column headers with product image, name, price, and Buy button pinned as the user scrolls down the spec rows (this is the #1 tested pattern for comparison UX — users abandon comparison tables that lose context on scroll).
- Collapse rarely-checked specs behind "Show more" rather than showing every row by default.
- Use ✓ / — (not colored icons) for boolean features to stay legible at a glance; reserve `success`/`accent` color for the *differences*, so the eye jumps straight to what's different between two laptops.

### Cart / checkout
- Checkout is table stakes, not a differentiation opportunity — keep it short, guest-checkout-first, transparent on total cost (shipping/tax shown early, not sprung at the end — this is the #1 cited cause of cart abandonment industry-wide).
- Reuse the same spec-chip style from PLP/PDP in the cart line item, so the customer can double check "yes, this is the 16GB one" without leaving checkout.

### Empty / error states
- Written in the interface's plain voice: say what happened and the next action, never apologize or guess. "No laptops match these filters — try removing 'Under $500'" beats "Oops! Nothing here 😅."

---

## 5. Imagery & iconography

- **Product photography:** consistent angle (3/4 front-left), consistent backdrop (`alice-blue` or white), consistent soft shadow — treat every product photo like it came from the same photo booth. This consistency is the single highest-leverage "looks professionally designed, not templated" move available for a small catalog.
- **Badges/stickers:** small `light-coral`-on-`petal-frost` or `--color-accent-tint` badges for "Best Value," "Editor's Pick," "Price Drop" — this is where the brand's warmth shows up against all the trustworthy blue.
- **Custom spec icons:** build one consistent icon set (line weight, corner radius, single color — `prussian-blue` or `steel-blue`) for RAM/CPU/battery/storage/display, rather than mixing icon libraries. A bespoke-feeling 6-icon set for the specs that repeat on every product card is a small investment with outsized "this wasn't assembled from a kit" payoff.

---

## 6. Signature element (spend your one bold move here)

**The Plain-English Spec Translator.** On the PDP spec table, each raw spec (`16GB RAM`, `512GB SSD`, `Intel i5`) gets a small `light-coral` underline/dot. On hover (desktop) or tap (mobile), it reveals one honest, jargon-free sentence: *"Enough to keep 20+ browser tabs, Zoom, and Photoshop open without slowdown."* This is the concrete expression of "approachable" — it's not decoration, it directly removes the exact anxiety a budget laptop shopper has, it's unique to this brand's positioning (a gaming or premium store would never need this), and it gives the coral accent a real job instead of being purely decorative.

Keep everything else on the PDP quiet around this — the translator is the one moment of personality; the rest (photography, spec table, buy box) should be disciplined and get out of its way.

---

## 7. Motion (restrained — this is a trust-building brand, not a flashy one)

- Card hover: subtle lift (2–4px translateY) + shadow deepen, 150–200ms ease-out. No rotation, no scale-bounce.
- Add-to-cart: a brief icon micro-animation (cart icon "catches" the item) confirms the action without a full-screen modal interrupting browsing.
- Price/total updates in the configurator: animate the number change (count-up/down over ~300ms) so a price change is felt, not just noticed.
- Respect `prefers-reduced-motion` everywhere — disable the above for users who request it.
- No scroll-hijacking, no full-page load-in choreography — those read as premium/cinematic, which contradicts "approachable."

---

## 8. Voice & copy

- Plain verbs, sentence case, no exclamation-point salesiness. "Add to cart," not "Grab yours now!"
- Name things by what the shopper is doing, not the system: "Compare laptops," not "Add to comparison matrix."
- Explain trade-offs honestly in product copy — budget positioning earns trust by admitting what a cheaper model *doesn't* do well, not just what it does.
- Keep the same word for the same action everywhere (if the button says "Add to cart," the confirmation says "Added to cart," not "Item saved").

---

## 9. Build checklist (self-critique before shipping any page)

- [ ] Every text/background pairing checked against §1.1 — no free-hand contrast choices.
- [ ] No full-bleed blue gradient hero; no single repeating rounded-card-with-icon component doing every job (§2).
- [ ] Display face used with restraint (headlines/prices only) — body copy stays in the workhorse face.
- [ ] Product photography angle/backdrop/shadow consistent across every product card.
- [ ] Spec table above the fold on PDP; Buy button sticky on scroll.
- [ ] Comparison tool headers stay pinned while scrolling rows.
- [ ] Shipping/tax shown before the final checkout step, not sprung at payment.
- [ ] Motion respects `prefers-reduced-motion`; nothing scroll-hijacks.
- [ ] Empty/error states say what happened + the next action, no apology-filler copy.
- [ ] Keyboard focus visible on every interactive element (buttons, filter chips, compare checkboxes).