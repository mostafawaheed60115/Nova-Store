# Nova Store UX Contract

## Product context

- **Audience:** Egypt-based shoppers comparing laptops, components, monitors and peripherals, plus store staff and suppliers who fulfill orders.
- **Primary jobs:** Browse with confidence, compare a small set of products, add items to a cart, and complete a cash-on-delivery checkout.
- **Active locales:** Arabic (`ar`) and English (`en`), with RTL layout for Arabic.
- **Accessibility target:** WCAG 2.2 AA.

## Visual contract

- **Project design direction:** `DESIGN.md` is the durable source of visual intent.
- **Runtime token owner:** `src/index.css` defines the CSS custom properties consumed by shared storefront components.
- **Themes:** One light storefront theme; dark navy is reserved for footer and high-emphasis utility surfaces.

## Canonical UI Map

| Capability | Canonical owner | Source of truth | Allowed variants | Verification |
|---|---|---|---|---|
| Select/Listbox | Native `<select>` | Component markup with `data-select-owner="native"` | Native only; OS popup is accepted for low-risk utility and admin choices | Keyboard selection and visible selected value |
| Form | Component-owned React state | Component validation and service responses | Checkout / admin / supplier | Required fields, error state and submit recovery |
| Scrollbar | Global stylesheet | `src/index.css` | Compact geometry for dense panels | Desktop scroll surfaces |
| Toast | `StoreContext.addToast` + `ToastContainer` | `src/context/StoreContext.jsx` | success / warning / info / error | Live status, placement and dismissal |
| CRUD | Component services and `StoreContext` navigation | `src/services/*Service.js` | Return / stay according to the existing workflow | Storefront checkout and admin flows |

## Component behavior

- **Buttons:** 44px minimum touch target on mobile; visible focus ring; no visual-only disabled state; actions preserve their label while pending.
- **Search:** Header search is local, has an app-owned clear button, is IME-safe on Enter, and takes shoppers to a matching item or catalog.
- **Textarea:** Resizing is disabled; authored layout retains stable form geometry.
- **Product cards:** Product image and title open the detail route; add-to-cart is a separate action and out-of-stock items are disabled.

## Navigation and responsive behavior

- Route changes use `StoreContext.navigateTo`, reset scroll, and update the document title through `updateSeo`.
- Desktop catalog uses a sticky filter sidebar; on narrow screens filters move to a bottom sheet and primary browsing controls stay reachable above the bottom navigation.
- Storefront product grids use intrinsic responsive columns; administrative tables become cards on narrow screens.
- Drawers use a modal dialog pattern, restore focus on close, and expose Escape dismissal.

## Feedback and motion

- Toasts appear in a shared fixed container for non-critical confirmation and errors.
- The storefront carousel, hover feedback and card transitions respect `prefers-reduced-motion`.
- Motion is limited to state feedback and a maximum 200ms component response where possible.

## Verification

- Static checks: `npm run lint`, `npm run build`, and the premium strict project audit.
- Manual matrix: Arabic RTL and English LTR, desktop and narrow mobile viewport, keyboard focus, reduced motion, loading/empty state, and cart/checkout entry.
