import { supabase } from "../lib/supabaseClient";

/**
 * Helper to safely extract clean CDN URL if stored as JSON or string
 */
export function sanitizeImageUrl(link) {
  if (!link) return "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";
  if (typeof link === "string") {
    const trimmed = link.trim();
    if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
      try {
        const parsed = JSON.parse(trimmed);
        if (parsed && parsed.url) return parsed.url;
      } catch {
        /* ignore */
      }
    }
    return trimmed;
  }
  if (typeof link === "object" && link !== null && link.url) {
    return link.url;
  }
  return String(link);
}

/**
 * Maps Supabase DB product entity to frontend store product model
 */
export function formatDbProduct(p) {
  const rawPrimary =
    p.product_imgs?.find((img) => img.is_primary)?.img_link ||
    p.product_imgs?.[0]?.img_link ||
    "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";
  const primaryImg = sanitizeImageUrl(rawPrimary);
  const rawGallery = p.product_imgs?.map((img) => sanitizeImageUrl(img.img_link)) || [];
  const gallery = rawGallery.length > 0 ? rawGallery : [primaryImg];

  const currentOffer = p.product_offers?.[0];
  const price = currentOffer
    ? Number(currentOffer.price_after_offer)
    : Number(p.sale_price || 999);
  const originalPrice = Number(p.sale_price || price);
  const vendorPrice = Number(p.vendor_price || Math.round(price * 0.82));
  const stockCount = Number(p.stock_quantity ?? 0);

  const categorySlug =
    p.subcategories?.categories?.slug ||
    (p.subcategory_id <= 3
      ? "laptops"
      : p.subcategory_id <= 6
      ? "monitors"
      : p.subcategory_id <= 9
      ? "pc-bundles"
      : "accessories");
  const categoryId =
    p.subcategories?.categories?.id ||
    (p.subcategory_id <= 3 ? 1 : p.subcategory_id <= 6 ? 2 : p.subcategory_id <= 9 ? 3 : 4);

  return {
    id: p.id.toString(),
    dbId: p.id,
    supplierId: p.supplier_id || 1,
    name: p.name_en,
    nameAr: p.name_ar,
    category: categorySlug,
    categoryId: categoryId,
    categoryNameEn: p.subcategories?.categories?.name_en || categorySlug,
    categoryNameAr: p.subcategories?.categories?.name_ar || categorySlug,
    subcategory: p.subcategories?.slug || "general",
    subcategoryId: p.subcategories?.id || p.subcategory_id,
    subcategoryNameEn: p.subcategories?.name_en,
    subcategoryNameAr: p.subcategories?.name_ar,
    price,
    sale_price: Number(p.sale_price || price),
    vendor_price: vendorPrice,
    vendorPrice,
    originalPrice: originalPrice > price ? originalPrice : Math.round(price * 1.15),
    rating: 4.9,
    reviewCount: 45 + Math.floor(p.id * 7),
    badge: p.is_best_seller ? "Bestseller" : currentOffer ? "Deal" : p.is_featured ? "Featured" : null,
    inStock: p.is_active && stockCount > 0,
    stockCount: stockCount,
    stock_quantity: stockCount,
    image: primaryImg,
    gallery: gallery.length > 0 ? gallery : [primaryImg],
    shortDesc: p.description_en || "",
    shortDescAr: p.description_ar || "",
    description: p.description_en || "",
    descriptionAr: p.description_ar || "",
  };
}

/**
 * Fetches all categories with active subcategories
 */
export async function fetchCategories() {
  const { data, error } = await supabase
    .from("categories")
    .select("*, subcategories(*)")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Supabase fetchCategories error:", error);
    return [];
  }
  return (data || []).map((c) => ({
    id: c.id,
    slug: c.slug,
    name: c.name_en,
    nameEn: c.name_en,
    nameAr: c.name_ar,
    image: sanitizeImageUrl(c.img_link),
    sortOrder: c.sort_order,
    subcategories: (c.subcategories || []).map((s) => ({
      id: s.id,
      slug: s.slug,
      name: s.name_en,
      nameEn: s.name_en,
      nameAr: s.name_ar,
      categoryId: s.category_id,
    })),
  }));
}

/**
 * Fetches products joined with variants, images, and offers
 */
export async function fetchProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      subcategories (
        id,
        slug,
        name_en,
        name_ar,
        categories (
          id,
          slug,
          name_en,
          name_ar
        )
      ),
      product_imgs (*),
      product_offers (*)
    `)
    .eq("is_active", true)
    .order("id", { ascending: true });

  if (error) {
    console.warn("Supabase fetchProducts error, using fallback:", error);
    return null;
  }

  return data.map(formatDbProduct);
}

/**
 * Fetches CMS Hero Slides
 */
export async function fetchHeroSlides() {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Supabase fetchHeroSlides error:", error);
    return null;
  }

  return data.map((s) => ({
    id: s.id,
    tag: s.tag_badge_en || "Featured",
    tagAr: s.tag_badge_ar || "مميز",
    title: s.title_en,
    titleAr: s.title_ar,
    subtitle: s.subtitle_en,
    subtitleAr: s.subtitle_ar,
    image: sanitizeImageUrl(s.desktop_image),
    primaryCtaText: s.primary_cta_text_en || "Explore",
    primaryCtaTextAr: s.primary_cta_text_ar || "استكشف",
    primaryCtaLink: s.primary_cta_link || "/catalog",
    secondaryCtaText: s.secondary_cta_text_en || "Shop All",
    secondaryCtaTextAr: s.secondary_cta_text_ar || "تسوق الكل",
    secondaryCtaLink: s.secondary_cta_link || "/catalog",
  }));
}

/**
 * Fetches CMS Promotional Ads
 */
export async function fetchPromotionalAds() {
  const { data, error } = await supabase
    .from("promotional_ads")
    .select("*")
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (error) {
    console.warn("Supabase fetchPromotionalAds error:", error);
    return null;
  }

  return data.map((a) => ({
    id: `ad-${a.id}`,
    dbId: a.id,
    badgeEn: a.badge_text_en || "HOT PROMO",
    badgeAr: a.badge_text_ar || "عرض خاص",
    titleEn: a.title_en,
    titleAr: a.title_ar,
    subtitleEn: a.subtitle_en,
    subtitleAr: a.subtitle_ar,
    image: sanitizeImageUrl(a.desktop_image),
    btnTextEn: a.cta_text_en || "Explore",
    btnTextAr: a.cta_text_ar || "استكشف",
    link: a.cta_link ? { route: "catalog", params: {} } : { route: "catalog", params: {} },
    tag: a.title_en?.includes("NOVA15") ? "NOVA15" : a.title_en?.includes("300") ? "SAVE300" : "TITAN",
    accentColor: a.id === 1 ? "var(--light-coral)" : a.id === 2 ? "var(--blue-bell)" : "var(--steel-blue)",
  }));
}

/**
 * Validates a coupon against the database and calculates discount based on scope
 */
export async function validateCoupon(code, subtotal = 0, cartItems = []) {
  if (!code) return { valid: false, message: "Please enter a coupon code." };

  const cleanCode = code.trim().toUpperCase();

  const { data, error } = await supabase
    .from("coupons")
    .select("*, coupon_targeted_items(*)")
    .eq("code", cleanCode)
    .eq("is_active", true)
    .single();

  if (error || !data) {
    return { valid: false, message: "Invalid or inactive coupon code." };
  }

  const now = new Date();
  const startDate = new Date(data.start_date);
  const expireDate = new Date(data.expire_date);

  if (startDate > now) {
    return { valid: false, message: `Coupon is not active yet (starts ${startDate.toLocaleDateString()}).` };
  }

  if (expireDate < now) {
    return { valid: false, message: "Coupon code has expired." };
  }

  if (data.usage_limit_total && (data.used_count || 0) >= data.usage_limit_total) {
    return { valid: false, message: "Coupon code has reached its maximum total redemptions." };
  }

  if (data.min_order_amount && subtotal < Number(data.min_order_amount)) {
    return {
      valid: false,
      message: `Minimum order of ${Number(data.min_order_amount).toLocaleString()} EGP required for this coupon.`,
    };
  }

  // Calculate applicable subtotal based on target_scope
  let applicableSubtotal = subtotal;
  const targetedItems = data.coupon_targeted_items || [];

  if (data.target_scope === "specific_categories" && targetedItems.length > 0) {
    const targetedCatIds = targetedItems.map((t) => Number(t.target_id));
    const matchingItems = cartItems.filter((item) => {
      const catId = Number(item.product?.category_id || item.product?.subcategories?.category_id || item.product?.categoryId || 0);
      return targetedCatIds.includes(catId);
    });

    if (matchingItems.length === 0 && cartItems.length > 0) {
      return { valid: false, message: "Coupon is only applicable to selected categories." };
    }

    if (matchingItems.length > 0) {
      applicableSubtotal = matchingItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    }
  } else if (data.target_scope === "specific_products" && targetedItems.length > 0) {
    const targetedProdIds = targetedItems.map((t) => Number(t.target_id));
    const matchingItems = cartItems.filter((item) => {
      const pId = Number(item.productId || item.product?.id || item.id || 0);
      return targetedProdIds.includes(pId);
    });

    if (matchingItems.length === 0 && cartItems.length > 0) {
      return { valid: false, message: "Coupon is only applicable to selected specific products." };
    }

    if (matchingItems.length > 0) {
      applicableSubtotal = matchingItems.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
    }
  }

  let discountAmount = 0;
  if (data.discount_type === "percentage") {
    discountAmount = Math.round((applicableSubtotal * Number(data.discount_value)) / 100);
    if (data.max_discount_amount) {
      discountAmount = Math.min(discountAmount, Number(data.max_discount_amount));
    }
  } else {
    discountAmount = Math.min(Number(data.discount_value), applicableSubtotal);
  }

  return {
    valid: true,
    coupon: data,
    discountAmount,
    discountType: data.discount_type,
    discountValue: data.discount_value,
    applicableSubtotal,
  };
}

/**
 * Submits an order with multi-supplier routing into public.orders, public.sub_orders, and public.order_items
 */
export async function submitOrder(orderPayload) {
  const {
    customerName,
    customerPhone,
    customerPhoneSecondary = null,
    shippingAddress,
    notes = "",
    paymentMethod = "cod",
    subtotalPrice,
    totalShippingFee = 50,
    totalDiscount = 0,
    finalPrice,
    couponId = null,
    items = [],
  } = orderPayload;

  // Generate clean unique order code e.g. NOV-M8F3-7281
  const uniqueId = Math.random().toString(36).substring(2, 6).toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const orderCode = `NOV-${uniqueId}-${randomSuffix}`;

  // 1. Insert Main Order
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert([
      {
        order_code: orderCode,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        customer_phone_secondary: customerPhoneSecondary ? customerPhoneSecondary.trim() : null,
        shipping_address: shippingAddress.trim(),
        notes: notes ? notes.trim() : null,
        payment_method: paymentMethod,
        subtotal_price: Number(subtotalPrice),
        total_shipping_fee: Number(totalShippingFee),
        total_discount: Number(totalDiscount),
        final_price: Number(finalPrice),
        coupon_id: couponId ? Number(couponId) : null,
        order_status: "pending",
      },
    ])
    .select()
    .single();

  if (orderError) {
    throw new Error(`Order Creation Failed: ${orderError.message}`);
  }

  // 2. Group items by supplier for multi-supplier fulfillment routing
  const itemsBySupplier = {};
  for (const item of items) {
    const sId = Number(item.product?.supplierId || item.supplierId || item.product?.supplier_id || 1);
    if (!itemsBySupplier[sId]) {
      itemsBySupplier[sId] = [];
    }
    itemsBySupplier[sId].push(item);
  }

  const supplierIds = Object.keys(itemsBySupplier);
  const numSuppliers = supplierIds.length || 1;
  const splitShipping = Math.round(Number(totalShippingFee) / numSuppliers);

  // 3. Create sub_orders per supplier and insert order_items
  let subOrderIdx = 1;
  for (const sIdStr of supplierIds) {
    const sId = Number(sIdStr);
    const supplierItems = itemsBySupplier[sId];
    const supplierSubtotal = supplierItems.reduce(
      (sum, it) => sum + (Number(it.product?.price || it.price || 0) * (Number(it.quantity) || 1)),
      0
    );
    const supplierVendorCost = supplierItems.reduce(
      (sum, it) => sum + (Number(it.variant?.vendor_price || it.product?.vendor_price || Math.round(Number(it.product?.price || it.price || 0) * 0.82)) * (Number(it.quantity) || 1)),
      0
    );

    const subOrderCode = `${orderCode}-S${subOrderIdx++}`;
    const { data: subOrder, error: subErr } = await supabase
      .from("sub_orders")
      .insert([
        {
          order_id: order.id,
          supplier_id: sId,
          sub_order_code: subOrderCode,
          supplier_subtotal: supplierSubtotal,
          supplier_vendor_cost: supplierVendorCost,
          shipping_cost: splitShipping,
          discount_share: Math.round(Number(totalDiscount) / numSuppliers),
          cod_amount_to_collect: supplierSubtotal + splitShipping - Math.round(Number(totalDiscount) / numSuppliers),
          status: "pending",
        },
      ])
      .select()
      .single();

    if (!subErr && subOrder) {
      const lineItems = [];
      for (const item of supplierItems) {
        const prodDbId = Number(item.product?.dbId || item.productId || item.id || 1);
        lineItems.push({
          sub_order_id: subOrder.id,
          product_id: prodDbId,
          variant_id: null,
          product_name_snapshot: item.product?.name || item.name || "Nova Hardware Item",
          variant_name_snapshot: null,
          quantity: Number(item.quantity) || 1,
          unit_sale_price: Number(item.price || item.product?.price || 999),
          unit_vendor_price: Number(
            item.product?.vendor_price ||
              item.product?.vendorPrice ||
              Math.round(Number(item.price || item.product?.price || 999) * 0.82)
          ),
          discount_amount: 0,
          total_price: Number(item.price || item.product?.price || 999) * (Number(item.quantity) || 1),
        });
      }

      if (lineItems.length > 0) {
        await supabase.from("order_items").insert(lineItems);
      }
    }
  }

  // 4. Record Coupon Usage & Increment used_count if applied
  if (couponId) {
    try {
      await supabase.from("coupon_usages").insert([
        {
          coupon_id: Number(couponId),
          order_id: order.id,
          customer_phone: customerPhone.trim(),
          discount_applied: Number(totalDiscount),
        },
      ]);
      const { data: c } = await supabase.from("coupons").select("used_count").eq("id", couponId).single();
      if (c) {
        await supabase.from("coupons").update({ used_count: (c.used_count || 0) + 1 }).eq("id", couponId);
      }
    } catch (cErr) {
      console.warn("Coupon usage note:", cErr.message);
    }
  }

  return {
    success: true,
    orderId: order.id,
    orderCode: order.order_code,
    finalPrice: order.final_price,
    customerName: order.customer_name,
  };
}
