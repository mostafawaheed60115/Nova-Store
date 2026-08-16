/**
 * Nova Store SEO & Schema.org JSON-LD Manager
 * Handles dynamic title, meta descriptions, canonical URLs, bilingual hreflang,
 * OpenGraph, Twitter cards, JSON-LD structured data, and portal security noindex guards.
 */

const SITE_URL = "https://novastore.eg";
const DEFAULT_IMAGE = SITE_URL + "/Assets/no%20bg%20logo.png";

function setMetaTag(attr, key, content) {
  if (!content) return;
  let element = document.querySelector(`meta[${attr}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attr, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(url) {
  let link = document.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", url);
}

function setJsonLd(id, data) {
  let script = document.getElementById(id);
  if (!script) {
    script = document.createElement("script");
    script.id = id;
    script.type = "application/ld+json";
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}

function removeJsonLd(id) {
  const script = document.getElementById(id);
  if (script) {
    script.remove();
  }
}

export function updateSeo({
  title,
  description,
  path = "/",
  image = DEFAULT_IMAGE,
  type = "website",
  isPrivate = false,
  lang = "ar",
  product = null,
  breadcrumbs = null,
}) {
  const isAr = lang === "ar";
  const fullTitle = title
    ? `${title} | Nova Store`
    : "Nova Store — High Quality and Best Prices";

  const fullDesc = description ||
    (isAr
      ? "تسوق أحدث اللابتوبات الأصلية، أجهزة الألعاب، ومستلزمات الكمبيوتر بأفضل أسعار التقسيط وضمان 24 شهر مع خدمة الدفع عند الاستلام في مصر."
      : "Shop premium laptops, gaming PCs, and tech accessories with fast COD delivery across Egypt, authentic warranty, and flexible installments.");

  const currentUrl = `${SITE_URL}${path}`;

  // 1. Title & Meta Description
  document.title = fullTitle;
  setMetaTag("name", "description", fullDesc);

  // 2. Canonical & Hreflang
  setCanonical(currentUrl);

  // 3. Robots Guard: Strictly prevent search engines from indexing Admin & Supplier dashboards
  if (isPrivate) {
    setMetaTag("name", "robots", "noindex, nofollow, noarchive");
  } else {
    setMetaTag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1");
  }

  // 4. OpenGraph Tags
  setMetaTag("property", "og:title", fullTitle);
  setMetaTag("property", "og:description", fullDesc);
  setMetaTag("property", "og:url", currentUrl);
  setMetaTag("property", "og:image", image);
  setMetaTag("property", "og:type", type);
  setMetaTag("property", "og:site_name", isAr ? "نوفا ستور" : "Nova Store");
  setMetaTag("property", "og:locale", isAr ? "ar_EG" : "en_US");

  // 5. Twitter Card Tags
  setMetaTag("name", "twitter:card", "summary_large_image");
  setMetaTag("name", "twitter:title", fullTitle);
  setMetaTag("name", "twitter:description", fullDesc);
  setMetaTag("name", "twitter:image", image);

  // 6. Organization & WebSite JSON-LD Schema
  setJsonLd("schema-store", {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    name: "Nova Store",
    alternateName: "نوفا ستور",
    url: SITE_URL,
    logo: `${SITE_URL}/Assets/no%20bg%20logo.png`,
    description: "Premium Multi-Vendor Dropshipping & E-Commerce Platform in Egypt.",
    currenciesAccepted: "EGP",
    paymentAccepted: "Cash on Delivery, Credit Card",
    priceRange: "EGP",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/catalog?search={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  });

  // 7. Product Schema (if on Product Detail Page)
  if (product) {
    const price = Number(product.price || product.sale_price || 0);
    const prodName = isAr ? (product.nameAr || product.name) : (product.name || product.nameAr);
    const prodDesc = isAr ? (product.descriptionAr || product.description) : (product.description || product.descriptionAr);
    const prodImg = product.image || product.product_imgs?.[0]?.img_link || image;

    setJsonLd("schema-product", {
      "@context": "https://schema.org",
      "@type": "Product",
      name: prodName,
      image: [prodImg],
      description: prodDesc || fullDesc,
      sku: `NOVA-${product.id}`,
      brand: {
        "@type": "Brand",
        name: "Nova Store",
      },
      offers: {
        "@type": "Offer",
        url: currentUrl,
        priceCurrency: "EGP",
        price: price,
        priceValidUntil: new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10),
        itemCondition: product.condition === "used"
          ? "https://schema.org/UsedCondition"
          : product.condition === "refurbished"
          ? "https://schema.org/RefurbishedCondition"
          : "https://schema.org/NewCondition",
        availability: (product.stock_quantity > 0 || product.inStock !== false)
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
        seller: {
          "@type": "Organization",
          name: "Nova Store",
        },
      },
    });
  } else {
    removeJsonLd("schema-product");
  }

  // 8. BreadcrumbList Schema (if provided)
  if (breadcrumbs && breadcrumbs.length > 0) {
    setJsonLd("schema-breadcrumbs", {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: breadcrumbs.map((b, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: b.name,
        item: b.url ? `${SITE_URL}${b.url}` : currentUrl,
      })),
    });
  } else {
    removeJsonLd("schema-breadcrumbs");
  }
}
