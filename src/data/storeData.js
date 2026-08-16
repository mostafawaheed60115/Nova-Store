/**
 * Nova Store - Clean Data & Spec Translations
 * All catalog and CMS data is loaded dynamically from Supabase database.
 */

export const NOVA_DATA = {
  categories: [],
  products: [],
  coupons: []
};

export const CMS_AD_SLIDES = [];

/**
 * Formats a monetary number into Egyptian Pounds (EGP / ج.م) based on language.
 */
export function formatCurrency(amount = 0, lang = "en") {
  const formattedNumber = Number(amount || 0).toLocaleString();
  return lang === "ar" ? `${formattedNumber} ج.م` : `${formattedNumber} EGP`;
}

/**
 * Calculates cart totals, discounts, taxes and shipping in EGP.
 */
export function calculateCartTotals(cartItems = [], appliedCouponCode = null, couponDetails = null) {
  let subtotal = 0;
  let totalSavings = 0;
  let lineItemDiscounts = {};
  let shippingCost = 65.00; // Standard shipping rate in EGP

  cartItems.forEach(item => {
    const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
    subtotal += itemTotal;
  });

  if (subtotal >= 5000) {
    shippingCost = 0;
  }

  let couponObj = couponDetails || null;
  let couponError = null;

  if (appliedCouponCode && couponDetails) {
    if (couponDetails.discountType === "percentage") {
      let discount = subtotal * (Number(couponDetails.discountValue) / 100);
      if (couponDetails.maxDiscountAmount && discount > Number(couponDetails.maxDiscountAmount)) {
        discount = Number(couponDetails.maxDiscountAmount);
      }
      totalSavings = discount;
    } else if (couponDetails.discountType === "fixed") {
      totalSavings = Math.min(subtotal, Number(couponDetails.discountValue || 0));
    }
  }

  const taxableSubtotal = Math.max(0, subtotal - totalSavings);
  const estimatedTax = Math.round(taxableSubtotal * 0.05);
  const grandTotal = Math.max(0, taxableSubtotal + shippingCost + estimatedTax);

  return {
    subtotal,
    totalSavings,
    lineItemDiscounts,
    shippingCost,
    estimatedTax,
    grandTotal,
    couponObj: couponError ? null : couponObj,
    couponError
  };
}

/**
 * Plain-English Spec Translator Dictionary & Helper (DESIGN.MD §6)
 * Translates technical jargon into approachable user benefits
 */
export const SPEC_TRANSLATIONS = {
  en: {
    // RAM
    "8GB": "Good for basic web browsing, word processing, and light streaming.",
    "16GB": "Sweet spot for smooth multitasking, 20+ browser tabs, and gaming.",
    "32GB": "Ideal for 4K video editing, heavy coding, 3D rendering, and heavy multitasking.",
    "64GB": "Extreme capacity for massive 3D scenes, virtual machines, and uncompressed video.",
    "96GB": "Professional workstation tier for scientific modeling and massive datasets.",
    "DDR5": "Faster memory speed that loads apps and files noticeably quicker.",

    // Storage
    "256GB": "Holds OS and ~50,000 photos or basic office apps.",
    "512GB": "Comfortable room for OS, software, and 5-10 modern games or editing projects.",
    "1TB": "Generous space for dozens of AAA games, video projects, and high-res media.",
    "2TB": "Huge library capacity — store hundreds of games or years of RAW video.",
    "4TB": "Massive archive space so you never need an external drive.",
    "NVMe": "Lightning-fast drive technology — boots Windows in seconds and opens apps instantly.",

    // Graphics (GPU)
    "RTX 4090": "Top-of-the-line graphics power. Plays any game at max settings with ray tracing.",
    "RTX 4080": "Ultra high-end GPU for high-framerate 4K gaming and fast 3D rendering.",
    "RTX 4070": "Great 1440p gaming and fluid video editing graphics.",
    "RTX 4060": "Solid 1080p high-fps gaming and smooth 1080p/4K video editing.",
    "Integrated": "Saves battery life and runs everyday apps, web, and HD video playback with ease.",

    // Processor (CPU)
    "Core i9": "Maximum processing speed with 24 cores for heavy rendering and multitasking.",
    "Core i7": "Powerful all-rounder for gaming, content creation, and fast app launching.",
    "Core i5": "Great budget-friendly performance for daily tasks, schoolwork, and casual gaming.",
    "Ryzen 9": "Exceptional multi-core speed with great power efficiency for heavy workloads.",
    "Ryzen 7": "Excellent performance per dollar for gaming and media creation.",

    // Display
    "240Hz": "Super smooth 240 frames-per-second refresh rate — gives competitive gamers an edge.",
    "165Hz": "Fluid screen motion that eliminates motion blur in fast action games.",
    "144Hz": "2.4x smoother than standard laptop screens for gaming and scrolling.",
    "QHD+": "Sharp 2560x1600 resolution — 78% more pixels than standard 1080p.",
    "4K": "Ultra sharp 3840x2160 resolution with pinpoint detail for photo/video editing.",
    "OLED": "Vivid contrast with true pitch-black levels and vibrant 100% DCI-P3 colors.",
    "Mini-LED": "Ultra bright backlight for HDR movies and accurate photo color work.",

    // Battery & Weight
    "99.9Wh": "Maximum battery capacity allowed on commercial flights.",
    "90Wh": "All-day battery life for productivity and class without hunting for outlets.",
    "Lightweight": "Easy to carry around in a backpack all day without back strain."
  },
  ar: {
    "8GB": "ممتازة للتصفح الأساسي، والعمل المكتبي، ومشاهدة الفيديوهات.",
    "16GB": "الحجم المثالي للتعدد السلس للمهام، فتح +20 علامة تبويب، والألعاب.",
    "32GB": "مثالية لتعديل فيديوهات 4K، البرمجة المتقدمة، والتصميم ثلاثي الأبعاد.",
    "512GB": "مساحة مريحة للنظام والتطبيقات و 5-10 ألعاب حديثة.",
    "1TB": "مساحة واسعة لعشرات الألعاب الضخمة ومشاريع الفيديو عالية الدقة.",
    "240Hz": "سلاسة فائقة بـ 240 إطار بالثانية — تمنحك أسبقية في الألعاب التنافسية.",
    "OLED": "تباين مذهل مع ألوان سوداء حقيقية وألوان حيوية 100%."
  }
};

/**
 * Matches a technical spec string (e.g. "16GB RAM" or "Core i9") to plain English
 */
export function getSpecExplanation(specKey, specValue, lang = "en") {
  const dictionary = SPEC_TRANSLATIONS[lang] || SPEC_TRANSLATIONS.en;
  const combined = `${specKey || ""} ${specValue || ""}`;
  
  for (const [term, explanation] of Object.entries(dictionary)) {
    if (combined.toLowerCase().includes(term.toLowerCase())) {
      return explanation;
    }
  }
  return null;
}
