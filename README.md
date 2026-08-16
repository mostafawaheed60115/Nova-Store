# Nova Store 🛍️🚀

> **Nova Store** is a modern, high-performance E-Commerce & Multi-Vendor Dropshipping platform engineered for the Egyptian market with bilingual support (Arabic/English), Cash-on-Delivery (COD) fulfillment workflow, real-time Admin Operations Console, and Supplier Fulfillment Hub powered by Supabase.

---

## 🌟 Key Features

### 🛒 Customer Storefront
- **Bilingual & RTL-Ready**: Seamless Arabic (`ar`) and English (`en`) layout switching with localized typography (Cairo / Inter).
- **Interactive Catalog**: Real-time category filtering, fast full-text search, condition filters (New, Used, Refurbished), and price sliders.
- **Dynamic Promotions & Flash Deals**: Automated discount countdowns, promotional banners, and discount coupon engine with minimum order caps and targeted scopes.
- **Cart & COD Checkout**: Cash-on-Delivery checkout with multi-supplier parcel routing and address/phone validation.
- **Client-Side Image Optimization**: Automatic Canvas-based WebP compression for media uploads.

### 🛡️ Admin Operations Dashboard
- **Executive KPI Analytics**: Live metrics for revenue, fulfilled orders, pending dispatches, catalog counts, and supplier hubs.
- **Master Order Management**: Split multi-vendor sub-orders, track parcel fulfillment, assign couriers, and manage COD remittance lifecycle.
- **Full Catalog CRUD**: Create and manage categories, subcategories, products, prices, deals, and image galleries.
- **Supplier & Hub Directory**: Manage vendor accounts, commission rates, shipping policies by city, and return/warranty terms.
- **Coupon Engine**: Percentage and fixed discount codes with scope targeting (Entire Order, Specific Categories, Specific Products).
- **CMS Manager**: Homepage Hero carousel slides, vertical promo ticker ads, trust propositions, and AI Shopping Assistant configs.
- **WebP Media Studio**: In-browser bulk image converter with direct upload to Supabase CDN.

### 🏬 Supplier Fulfillment Hub
- **Dedicated Vendor Portal**: Simple login for merchant partners (`user: nova`, `pass: AnAelwelf17##`).
- **Sub-Order Dispatch**: Manage parcel fulfillment stages (`pending` ➔ `accepted_by_supplier` ➔ `ready_for_pickup` ➔ `picked_up` ➔ `out_for_delivery` ➔ `delivered`).
- **Courier & SLA Tracking**: Assign shipping couriers (e.g. Bosta Express) and tracking numbers.
- **Product & Inventory Management**: Add products, adjust wholesale prices, and update real-time stock levels.
- **City Shipping Rates**: Configure custom delivery rates and SLAs per city.

---

## 🛠️ Technology Stack

- **Frontend**: React 19, Vite 8, Framer Motion, Lucide React
- **Styling**: Vanilla CSS Design System with theme variables and responsive breakpoints
- **Backend & Database**: Supabase (PostgreSQL 17)
- **Security**: PostgreSQL Row Level Security (RLS) & `pgcrypto` password hashing
- **Media**: Supabase Storage CDN with client-side WebP compression

---

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/mostafawaheed60115/Nova-Store.git
cd Nova-Store
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=https://kiqdwtahfhkoehbckhsp.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_c8mOgy-GrJ-N2wqgp-0pBg_13IMUv34
```

### 4. Run Locally
```bash
npm run dev
```

### 5. Build for Production
```bash
npm run build
```

---

## 🔐 Default Access Credentials

| Role | Username / Identifier | Password | Portal |
|---|---|---|---|
| **System Admin** | `nova` | `AnAelwelf17##` | `Admin Dashboard` |
| **Supplier / Vendor** | `nova` | `AnAelwelf17##` | `Supplier Hub` |

---

## 📄 License
This project is proprietary and confidential. Built for Nova Store.

