import { supabase } from "../lib/supabaseClient";

const ADMIN_STORAGE_KEY = "nova_admin_session";

/**
 * Authenticates admin against PostgreSQL pgcrypto hashed password in public.admins
 */
export async function loginAdmin(username, password) {
  const { data, error } = await supabase.rpc("verify_admin_password", {
    p_username: username.trim(),
    p_password: password,
  });

  if (error) {
    throw new Error(`Admin Authentication Failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Invalid admin username or password.");
  }

  const adminUser = data[0];
  try {
    sessionStorage.setItem(ADMIN_STORAGE_KEY, JSON.stringify(adminUser));
  } catch {
    /* ignore */
  }

  return adminUser;
}

export function getCurrentAdmin() {
  try {
    const saved = sessionStorage.getItem(ADMIN_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function logoutAdmin() {
  try {
    sessionStorage.removeItem(ADMIN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Fetches dashboard KPI summary metrics
 */
export async function fetchAdminMetrics() {
  const [ordersRes, prodsRes, suppliersRes, couponsRes] = await Promise.allSettled([
    supabase.from("orders").select("final_price, order_status"),
    supabase.from("products").select("id", { count: "exact" }),
    supabase.from("suppliers").select("id", { count: "exact" }),
    supabase.from("coupons").select("id", { count: "exact" }),
  ]);

  const orders = ordersRes.status === "fulfilled" && ordersRes.value.data ? ordersRes.value.data : [];
  const totalRevenue = orders
    .filter((o) => o.order_status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.final_price || 0), 0);

  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.order_status === "pending").length;
  const totalProducts = prodsRes.status === "fulfilled" ? prodsRes.value.count || 0 : 0;
  const totalSuppliers = suppliersRes.status === "fulfilled" ? suppliersRes.value.count || 0 : 0;
  const totalCoupons = couponsRes.status === "fulfilled" ? couponsRes.value.count || 0 : 0;

  return {
    totalRevenue,
    totalOrders,
    pendingOrders,
    totalProducts,
    totalSuppliers,
    totalCoupons,
  };
}

/**
 * Fetches master list of all orders with sub-orders and order items
 */
export async function fetchMasterOrders() {
  const { data, error } = await supabase
    .from("orders")
    .select(`
      *,
      coupons (code, discount_type, discount_value),
      sub_orders (
        *,
        suppliers (id, name, phone),
        order_items (*)
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch master orders: ${error.message}`);
  }
  return data || [];
}

/**
 * Admin manual master status override for an order and its underlying sub-orders
 */
export async function updateMasterOrderStatus(orderId, newStatus) {
  const { data, error } = await supabase
    .from("orders")
    .update({ order_status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order status: ${error.message}`);
  }

  // Cascading update to sub-orders if cancelled
  if (newStatus === "cancelled") {
    await supabase
      .from("sub_orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
      .eq("order_id", orderId);
  }

  return data;
}

/**
 * Deletes an order and its cascading records
 */
export async function deleteMasterOrder(orderId) {
  const { data: subOrders } = await supabase.from("sub_orders").select("id").eq("order_id", orderId);
  if (subOrders && subOrders.length > 0) {
    const subOrderIds = subOrders.map((s) => s.id);
    await supabase.from("order_items").delete().in("sub_order_id", subOrderIds);
    await supabase.from("sub_orders").delete().eq("order_id", orderId);
  }
  await supabase.from("coupon_usages").delete().eq("order_id", orderId);
  const { error } = await supabase.from("orders").delete().eq("id", orderId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: orderId };
}

/**
 * Updates financial settlement status for a specific sub-order
 */
export async function updateSubOrderFinances(subOrderId, { courierCashStatus, supplierPayoutStatus, trackingNumber, status }) {
  const updateData = { updated_at: new Date().toISOString() };
  if (courierCashStatus) updateData.courier_cash_status = courierCashStatus;
  if (supplierPayoutStatus) updateData.supplier_payout_status = supplierPayoutStatus;
  if (trackingNumber !== undefined) updateData.courier_tracking_number = trackingNumber;
  if (status) updateData.status = status;

  const { data, error } = await supabase
    .from("sub_orders")
    .update(updateData)
    .eq("id", subOrderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update sub-order finances: ${error.message}`);
  }
  return data;
}

/* =========================================================================
   CATEGORIES & SUBCATEGORIES CRUD
   ========================================================================= */

export async function fetchCategoriesAdmin() {
  const { data, error } = await supabase
    .from("categories")
    .select(`
      *,
      subcategories (*)
    `)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createCategory(catData) {
  const { nameEn, nameAr, slug, imgLink, sortOrder = 0, isActive = true } = catData;
  const cleanSlug = slug || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("categories")
    .insert([
      {
        name_en: nameEn.trim(),
        name_ar: nameAr ? nameAr.trim() : nameEn.trim(),
        slug: cleanSlug,
        img_link: imgLink || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateCategory(catId, catData) {
  const updatePayload = {};
  if (catData.nameEn !== undefined) updatePayload.name_en = catData.nameEn.trim();
  if (catData.nameAr !== undefined) updatePayload.name_ar = catData.nameAr.trim();
  if (catData.slug !== undefined) updatePayload.slug = catData.slug.trim();
  if (catData.imgLink !== undefined) updatePayload.img_link = catData.imgLink;
  if (catData.sortOrder !== undefined) updatePayload.sort_order = Number(catData.sortOrder);
  if (catData.isActive !== undefined) updatePayload.is_active = catData.isActive;

  const { data, error } = await supabase
    .from("categories")
    .update(updatePayload)
    .eq("id", catId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteCategory(catId) {
  // 1. Try atomic PostgreSQL RPC with safe cascading first
  const { data: rpcData, error: rpcError } = await supabase.rpc("delete_category_cascade", {
    p_cat_id: Number(catId),
  });

  if (!rpcError && rpcData?.success) {
    return { success: true, deletedId: catId };
  }

  // 2. Fallback in JS:
  const { data: subs } = await supabase.from("subcategories").select("id").eq("category_id", catId);
  const subIds = (subs || []).map((s) => s.id);

  // Find a fallback subcategory outside this category
  const { data: fallbackSubs } = await supabase
    .from("subcategories")
    .select("id")
    .neq("category_id", catId)
    .limit(1);
  const fallbackSubId = fallbackSubs?.[0]?.id || null;

  if (subIds.length > 0) {
    await supabase.from("coupon_targeted_items").delete().eq("target_type", "category").eq("target_id", catId);

    for (const sId of subIds) {
      await supabase.from("coupon_targeted_items").delete().eq("target_type", "subcategory").eq("target_id", sId);
      const { data: prods } = await supabase.from("products").select("id").eq("subcategory_id", sId);

      for (const p of prods || []) {
        const { data: ordered } = await supabase.from("order_items").select("id").eq("product_id", p.id).limit(1);
        if (ordered && ordered.length > 0) {
          if (fallbackSubId) {
            await supabase.from("products").update({ subcategory_id: fallbackSubId, is_active: false }).eq("id", p.id);
          }
        } else {
          await supabase.from("coupon_targeted_items").delete().eq("target_type", "product").eq("target_id", p.id);
          await supabase.from("product_offers").delete().eq("product_id", p.id);
          await supabase.from("product_imgs").delete().eq("product_id", p.id);
          await supabase.from("products").delete().eq("id", p.id);
        }
      }
      await supabase.from("subcategories").delete().eq("id", sId);
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", catId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: catId };
}

export async function fetchSubcategories() {
  const { data, error } = await supabase
    .from("subcategories")
    .select("*, categories(id, name_en, name_ar, slug)")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createSubcategory(subData) {
  const { categoryId, nameEn, nameAr, slug, imgLink, sortOrder = 0, isActive = true } = subData;
  const cleanSlug = slug || nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

  const { data, error } = await supabase
    .from("subcategories")
    .insert([
      {
        category_id: Number(categoryId),
        name_en: nameEn.trim(),
        name_ar: nameAr ? nameAr.trim() : nameEn.trim(),
        slug: cleanSlug,
        img_link: imgLink || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateSubcategory(subId, subData) {
  const updatePayload = {};
  if (subData.categoryId !== undefined) updatePayload.category_id = Number(subData.categoryId);
  if (subData.nameEn !== undefined) updatePayload.name_en = subData.nameEn.trim();
  if (subData.nameAr !== undefined) updatePayload.name_ar = subData.nameAr.trim();
  if (subData.slug !== undefined) updatePayload.slug = subData.slug.trim();
  if (subData.imgLink !== undefined) updatePayload.img_link = subData.imgLink;
  if (subData.sortOrder !== undefined) updatePayload.sort_order = Number(subData.sortOrder);
  if (subData.isActive !== undefined) updatePayload.is_active = subData.isActive;

  const { data, error } = await supabase
    .from("subcategories")
    .update(updatePayload)
    .eq("id", subId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteSubcategory(subId) {
  // 1. Try atomic PostgreSQL RPC with safe cascading first
  const { data: rpcData, error: rpcError } = await supabase.rpc("delete_subcategory_cascade", {
    p_sub_id: Number(subId),
  });

  if (!rpcError && rpcData?.success) {
    return { success: true, deletedId: subId };
  }

  // 2. Fallback in JS:
  const { data: fallbackSubs } = await supabase
    .from("subcategories")
    .select("id")
    .neq("id", subId)
    .limit(1);
  const fallbackSubId = fallbackSubs?.[0]?.id || null;

  const { data: prods } = await supabase.from("products").select("id").eq("subcategory_id", subId);
  for (const p of prods || []) {
    const { data: ordered } = await supabase.from("order_items").select("id").eq("product_id", p.id).limit(1);
    if (ordered && ordered.length > 0) {
      if (fallbackSubId) {
        await supabase.from("products").update({ subcategory_id: fallbackSubId, is_active: false }).eq("id", p.id);
      }
    } else {
      await supabase.from("coupon_targeted_items").delete().eq("target_type", "product").eq("target_id", p.id);
      await supabase.from("product_offers").delete().eq("product_id", p.id);
      await supabase.from("product_imgs").delete().eq("product_id", p.id);
      await supabase.from("products").delete().eq("id", p.id);
    }
  }

  await supabase.from("coupon_targeted_items").delete().eq("target_type", "subcategory").eq("target_id", subId);
  const { error } = await supabase.from("subcategories").delete().eq("id", subId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: subId };
}

/* =========================================================================
   PRODUCTS, VARIANTS, IMAGES, & OFFERS CRUD
   ========================================================================= */

export async function fetchAdminProducts() {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      subcategories (
        id,
        name_en,
        name_ar,
        slug,
        categories (id, name_en, name_ar, slug)
      ),
      suppliers (id, name, phone),
      product_imgs (*),
      product_offers (*)
    `)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAdminProduct(productData) {
  const {
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    subcategoryId,
    supplierId,
    condition = "new",
    salePrice = 0,
    vendorPrice = 0,
    stockQuantity = 10,
    imgLink,
    isBestSeller = false,
    isFeatured = false,
    isActive = true,
    images = [],
  } = productData;

  const { data: product, error: prodError } = await supabase
    .from("products")
    .insert([
      {
        supplier_id: Number(supplierId) || 1,
        subcategory_id: Number(subcategoryId) || 1,
        name_en: nameEn.trim(),
        name_ar: nameAr ? nameAr.trim() : nameEn.trim(),
        description_en: descriptionEn || "",
        description_ar: descriptionAr || descriptionEn || "",
        condition: condition,
        sale_price: Number(salePrice) || 0,
        vendor_price: Number(vendorPrice) || Math.round((Number(salePrice) || 0) * 0.85),
        stock_quantity: Number(stockQuantity) || 0,
        is_best_seller: Boolean(isBestSeller),
        is_featured: Boolean(isFeatured),
        is_active: isActive !== false,
      },
    ])
    .select()
    .single();

  if (prodError) throw new Error(prodError.message);

  // Insert Images
  if (Array.isArray(images) && images.length > 0) {
    const imgRows = images.map((img, idx) => {
      const rawLink = typeof img === "string" ? img : (img.imgLink || img.url || "");
      const cleanLink = typeof rawLink === "string" ? rawLink.trim() : (rawLink?.url || String(rawLink));
      return {
        product_id: product.id,
        variant_id: null,
        img_link: cleanLink,
        is_primary: typeof img === "object" ? Boolean(img.isPrimary) : idx === 0,
        sort_order: idx + 1,
      };
    });

    const { error: imgError } = await supabase.from("product_imgs").insert(imgRows);
    if (imgError) console.warn("Error inserting product images:", imgError.message);
  } else if (imgLink && imgLink.trim()) {
    await supabase.from("product_imgs").insert([
      {
        product_id: product.id,
        variant_id: null,
        img_link: imgLink.trim(),
        is_primary: true,
        sort_order: 1,
      },
    ]);
  }

  return product;
}

export async function updateAdminProduct(productId, productData) {
  const updatePayload = {
    updated_at: new Date().toISOString(),
  };

  if (productData.nameEn !== undefined) updatePayload.name_en = productData.nameEn.trim();
  if (productData.nameAr !== undefined) updatePayload.name_ar = productData.nameAr.trim();
  if (productData.descriptionEn !== undefined) updatePayload.description_en = productData.descriptionEn;
  if (productData.descriptionAr !== undefined) updatePayload.description_ar = productData.descriptionAr;
  if (productData.subcategoryId !== undefined) updatePayload.subcategory_id = Number(productData.subcategoryId);
  if (productData.supplierId !== undefined) updatePayload.supplier_id = Number(productData.supplierId);
  if (productData.condition !== undefined) updatePayload.condition = productData.condition;
  if (productData.salePrice !== undefined) updatePayload.sale_price = Number(productData.salePrice);
  if (productData.vendorPrice !== undefined) updatePayload.vendor_price = Number(productData.vendorPrice);
  if (productData.stockQuantity !== undefined) updatePayload.stock_quantity = Number(productData.stockQuantity);
  if (productData.isBestSeller !== undefined) updatePayload.is_best_seller = productData.isBestSeller;
  if (productData.isFeatured !== undefined) updatePayload.is_featured = productData.isFeatured;
  if (productData.isActive !== undefined) updatePayload.is_active = productData.isActive;

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Toggles product activation status (soft deactivate)
 */
export async function toggleProductActive(productId, isActive) {
  const { data, error } = await supabase
    .from("products")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", productId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Safely deletes a product and cascading relations
 */
export async function deleteAdminProduct(productId) {
  const { data: ordered } = await supabase.from("order_items").select("id").eq("product_id", productId).limit(1);
  if (ordered && ordered.length > 0) {
    await supabase.from("products").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", productId);
    return { success: true, deletedId: productId, softDeleted: true };
  }

  await supabase.from("coupon_targeted_items").delete().eq("target_type", "product").eq("target_id", productId);
  await supabase.from("product_offers").delete().eq("product_id", productId);
  await supabase.from("product_imgs").delete().eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: productId };
}

/* ─── Product Images ─── */

export async function addProductImage(productId, { imgLink, isPrimary = false, variantId = null, sortOrder = 0 }) {
  if (isPrimary) {
    await supabase.from("product_imgs").update({ is_primary: false }).eq("product_id", productId);
  }

  const cleanLink = typeof imgLink === "string" ? imgLink.trim() : (imgLink?.url || String(imgLink));

  const { data, error } = await supabase
    .from("product_imgs")
    .insert([
      {
        product_id: productId,
        variant_id: variantId,
        img_link: cleanLink,
        is_primary: isPrimary,
        sort_order: Number(sortOrder) || 0,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProductImage(imageId, productId, { isPrimary, sortOrder }) {
  if (isPrimary) {
    await supabase.from("product_imgs").update({ is_primary: false }).eq("product_id", productId);
  }

  const updatePayload = {};
  if (isPrimary !== undefined) updatePayload.is_primary = isPrimary;
  if (sortOrder !== undefined) updatePayload.sort_order = Number(sortOrder);

  const { data, error } = await supabase
    .from("product_imgs")
    .update(updatePayload)
    .eq("id", imageId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProductImage(imageId) {
  const { error } = await supabase
    .from("product_imgs")
    .delete()
    .eq("id", imageId);

  if (error) throw new Error(error.message);
  return { success: true, deletedId: imageId };
}

/* ─── Product Offers ─── */

export async function fetchProductOffers() {
  const { data, error } = await supabase
    .from("product_offers")
    .select(`
      *,
      products (id, name_en, name_ar, sale_price)
    `)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createProductOffer(offerData) {
  const {
    productId,
    variantId = null,
    offerTitle,
    offerPercent,
    priceAfterOffer,
    offerStart,
    offerEnd,
    isFeatured = false,
    isActive = true,
  } = offerData;

  const { data, error } = await supabase
    .from("product_offers")
    .insert([
      {
        product_id: Number(productId),
        variant_id: variantId ? Number(variantId) : null,
        offer_title: offerTitle,
        offer_percent: Number(offerPercent),
        price_after_offer: Number(priceAfterOffer),
        offer_start: offerStart ? new Date(offerStart).toISOString() : new Date().toISOString(),
        offer_end: offerEnd ? new Date(offerEnd + "T23:59:59").toISOString() : new Date(Date.now() + 30 * 86400000).toISOString(),
        is_featured: isFeatured,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateProductOffer(offerId, offerData) {
  const updatePayload = {};
  if (offerData.offerTitle !== undefined) updatePayload.offer_title = offerData.offerTitle;
  if (offerData.offerPercent !== undefined) updatePayload.offer_percent = Number(offerData.offerPercent);
  if (offerData.priceAfterOffer !== undefined) updatePayload.price_after_offer = Number(offerData.priceAfterOffer);
  if (offerData.offerStart !== undefined) updatePayload.offer_start = new Date(offerData.offerStart).toISOString();
  if (offerData.offerEnd !== undefined) updatePayload.offer_end = new Date(offerData.offerEnd + "T23:59:59").toISOString();
  if (offerData.isFeatured !== undefined) updatePayload.is_featured = offerData.isFeatured;
  if (offerData.isActive !== undefined) updatePayload.is_active = offerData.isActive;

  const { data, error } = await supabase
    .from("product_offers")
    .update(updatePayload)
    .eq("id", offerId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteProductOffer(offerId) {
  const { error } = await supabase
    .from("product_offers")
    .delete()
    .eq("id", offerId);

  if (error) throw new Error(error.message);
  return { success: true, deletedId: offerId };
}

/* =========================================================================
   SUPPLIERS CRUD & FINANCIALS
   ========================================================================= */

export async function fetchAllSuppliers() {
  const { data, error } = await supabase
    .from("suppliers")
    .select(`
      *,
      supplier_shipping_policies (*),
      supplier_return_exchange_policies (*)
    `)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch suppliers: ${error.message}`);
  }
  return data || [];
}

export async function createSupplier(suppData) {
  const {
    name,
    phone,
    email,
    password = "SupplierDefault123#",
    isActive = true,
  } = suppData;

  const { data: hashData, error: hashError } = await supabase.rpc("hash_password_rpc", {
    p_plain: password,
  });

  if (hashError || !hashData) {
    throw new Error(`Password hashing error: ${hashError?.message || "Failed to hash password"}`);
  }

  const { data, error } = await supabase
    .from("suppliers")
    .insert([
      {
        name: name.trim(),
        phone: phone.trim(),
        email: email ? email.trim() : null,
        password_hash: hashData,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateSupplier(suppId, suppData) {
  const updatePayload = { updated_at: new Date().toISOString() };
  if (suppData.name !== undefined) updatePayload.name = suppData.name.trim();
  if (suppData.phone !== undefined) updatePayload.phone = suppData.phone.trim();
  if (suppData.email !== undefined) updatePayload.email = suppData.email ? suppData.email.trim() : null;
  if (suppData.isActive !== undefined) updatePayload.is_active = suppData.isActive;

  const { data, error } = await supabase
    .from("suppliers")
    .update(updatePayload)
    .eq("id", suppId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Admin changes supplier password with required admin verification password
 */
export async function changeSupplierPassword({ adminId, adminPassword, supplierId, newPassword }) {
  if (!adminPassword || !adminPassword.trim()) {
    throw new Error("Admin verification password is required.");
  }
  if (!newPassword || newPassword.length < 6) {
    throw new Error("New supplier password must be at least 6 characters.");
  }

  const { data, error } = await supabase.rpc("change_supplier_password", {
    p_admin_id: Number(adminId),
    p_admin_password: adminPassword,
    p_supplier_id: Number(supplierId),
    p_new_password: newPassword,
  });

  if (error) {
    throw new Error(error.message);
  }

  return { success: true, data };
}

export async function updateSupplierCommission(supplierId, commissionRate) {
  return updateSupplier(supplierId, { commissionRate });
}

export async function deleteSupplier(supplierId) {
  const { data, error } = await supabase.rpc("delete_supplier_cascade", {
    p_supplier_id: Number(supplierId),
  });

  if (error) {
    await supabase.from("supplier_shipping_policies").delete().eq("supplier_id", supplierId);
    await supabase.from("supplier_return_exchange_policies").delete().eq("supplier_id", supplierId);
    const { error: directErr } = await supabase.from("suppliers").delete().eq("id", supplierId);
    if (directErr) throw new Error(directErr.message);
  }

  return { success: true, deletedId: supplierId };
}

/* ─── Admin Supplier Policies CRUD ─── */

export async function fetchAdminSupplierPolicies(supplierId) {
  const [shippingRes, returnRes] = await Promise.allSettled([
    supabase.from("supplier_shipping_policies").select("*").eq("supplier_id", supplierId).order("id", { ascending: true }),
    supabase.from("supplier_return_exchange_policies").select("*").eq("supplier_id", supplierId).maybeSingle(),
  ]);

  return {
    shippingPolicies: shippingRes.status === "fulfilled" && shippingRes.value.data ? shippingRes.value.data : [],
    returnPolicy: returnRes.status === "fulfilled" && returnRes.value.data ? returnRes.value.data : null,
  };
}

export async function createAdminShippingPolicy(supplierId, policyData) {
  const { shippingCost = 50, estimatedDaysMin = 1, estimatedDaysMax = 3, isActive = true } = policyData;
  const { data, error } = await supabase
    .from("supplier_shipping_policies")
    .upsert(
      {
        supplier_id: Number(supplierId),
        shipping_cost: Number(shippingCost),
        estimated_days_min: Number(estimatedDaysMin),
        estimated_days_max: Number(estimatedDaysMax),
        is_active: isActive,
      },
      { onConflict: "supplier_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAdminShippingPolicy(policyId, policyData) {
  const payload = {};
  if (policyData.shippingCost !== undefined) payload.shipping_cost = Number(policyData.shippingCost);
  if (policyData.estimatedDaysMin !== undefined) payload.estimated_days_min = Number(policyData.estimatedDaysMin);
  if (policyData.estimatedDaysMax !== undefined) payload.estimated_days_max = Number(policyData.estimatedDaysMax);
  if (policyData.isActive !== undefined) payload.is_active = policyData.isActive;

  const { data, error } = await supabase
    .from("supplier_shipping_policies")
    .update(payload)
    .eq("id", policyId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAdminShippingPolicy(policyId) {
  const { error } = await supabase.from("supplier_shipping_policies").delete().eq("id", policyId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: policyId };
}

export async function saveAdminReturnPolicy(supplierId, policyData) {
  const { data, error } = await supabase
    .from("supplier_return_exchange_policies")
    .upsert(
      {
        supplier_id: Number(supplierId),
        ...policyData,
      },
      { onConflict: "supplier_id" }
    )
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/* =========================================================================
   COUPONS CRUD, TARGETED SCOPE, & USAGES
   ========================================================================= */

export async function fetchAdminCoupons() {
  const { data, error } = await supabase
    .from("coupons")
    .select(`
      *,
      coupon_targeted_items (*),
      coupon_usages (count)
    `)
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAdminCoupon(couponData) {
  const {
    code,
    discountType = "percentage",
    discountValue,
    maxDiscountAmount = null,
    minOrderAmount = 0,
    targetScope = "entire_order",
    usageLimitTotal = null,
    usageLimitPerPhone = 1,
    startDate,
    expireDate,
    isActive = true,
    targetedIds = [],
  } = couponData;

  const startIso = startDate ? new Date(startDate).toISOString() : new Date().toISOString();
  const expireIso = expireDate ? new Date(expireDate + "T23:59:59").toISOString() : new Date(Date.now() + 60 * 86400000).toISOString();

  const { data: coupon, error } = await supabase
    .from("coupons")
    .insert([
      {
        code: code.trim().toUpperCase(),
        discount_type: discountType,
        discount_value: Number(discountValue),
        max_discount_amount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        min_order_amount: Number(minOrderAmount) || 0,
        target_scope: targetScope,
        usage_limit_total: usageLimitTotal ? Number(usageLimitTotal) : null,
        usage_limit_per_phone: Number(usageLimitPerPhone) || 1,
        used_count: 0,
        start_date: startIso,
        expire_date: expireIso,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (targetScope !== "entire_order" && targetedIds.length > 0) {
    const targetType = targetScope === "specific_categories" ? "category" : targetScope === "specific_suppliers" ? "supplier" : "product";
    const items = targetedIds.map((tid) => ({
      coupon_id: coupon.id,
      target_type: targetType,
      target_id: Number(tid),
    }));
    await supabase.from("coupon_targeted_items").insert(items);
  }

  return coupon;
}

export async function updateAdminCoupon(couponId, couponData) {
  const updatePayload = {};
  if (couponData.code !== undefined) updatePayload.code = couponData.code.trim().toUpperCase();
  if (couponData.discountType !== undefined) updatePayload.discount_type = couponData.discountType;
  if (couponData.discountValue !== undefined) updatePayload.discount_value = Number(couponData.discountValue);
  if (couponData.maxDiscountAmount !== undefined) updatePayload.max_discount_amount = couponData.maxDiscountAmount ? Number(couponData.maxDiscountAmount) : null;
  if (couponData.minOrderAmount !== undefined) updatePayload.min_order_amount = Number(couponData.minOrderAmount) || 0;
  if (couponData.targetScope !== undefined) updatePayload.target_scope = couponData.targetScope;
  if (couponData.usageLimitTotal !== undefined) updatePayload.usage_limit_total = couponData.usageLimitTotal ? Number(couponData.usageLimitTotal) : null;
  if (couponData.usageLimitPerPhone !== undefined) updatePayload.usage_limit_per_phone = Number(couponData.usageLimitPerPhone) || 1;
  if (couponData.startDate !== undefined) updatePayload.start_date = new Date(couponData.startDate).toISOString();
  if (couponData.expireDate !== undefined) updatePayload.expire_date = new Date(couponData.expireDate + "T23:59:59").toISOString();
  if (couponData.isActive !== undefined) updatePayload.is_active = couponData.isActive;

  const { data: coupon, error } = await supabase
    .from("coupons")
    .update(updatePayload)
    .eq("id", couponId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  if (couponData.targetedIds !== undefined) {
    await supabase.from("coupon_targeted_items").delete().eq("coupon_id", couponId);
    if (couponData.targetScope !== "entire_order" && couponData.targetedIds.length > 0) {
      const targetType = couponData.targetScope === "specific_categories" ? "category" : couponData.targetScope === "specific_suppliers" ? "supplier" : "product";
      const items = couponData.targetedIds.map((tid) => ({
        coupon_id: couponId,
        target_type: targetType,
        target_id: Number(tid),
      }));
      await supabase.from("coupon_targeted_items").insert(items);
    }
  }

  return coupon;
}

/**
 * Safely deletes a coupon and cascades related records
 */
export async function deleteAdminCoupon(couponId) {
  const { data, error } = await supabase.rpc("delete_coupon_cascade", {
    p_coupon_id: Number(couponId),
  });

  if (error) {
    await supabase.from("coupon_targeted_items").delete().eq("coupon_id", couponId);
    await supabase.from("orders").update({ coupon_id: null }).eq("coupon_id", couponId);
    await supabase.from("coupon_usages").delete().eq("coupon_id", couponId);
    const { error: directErr } = await supabase.from("coupons").delete().eq("id", couponId);
    if (directErr) throw new Error(directErr.message);
  }

  return { success: true, deletedId: couponId };
}

export async function fetchCouponUsages(couponId) {
  const { data, error } = await supabase
    .from("coupon_usages")
    .select(`
      *,
      orders (order_code, customer_name, final_price)
    `)
    .eq("coupon_id", couponId)
    .order("used_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

/* =========================================================================
   ADMIN USERS MANAGEMENT
   ========================================================================= */

export async function fetchAdminUsers() {
  const { data, error } = await supabase
    .from("admins")
    .select("id, username, email, role, is_active, created_at, updated_at")
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createAdminUser({ username, email, password, role = "admin", isActive = true }) {
  const { data: hashData, error: hashError } = await supabase.rpc("hash_password_rpc", {
    p_plain: password,
  });

  if (hashError || !hashData) {
    throw new Error(`Failed to hash admin password: ${hashError?.message}`);
  }

  const { data, error } = await supabase
    .from("admins")
    .insert([
      {
        username: username.trim().toLowerCase(),
        email: email.trim(),
        password_hash: hashData,
        role: role,
        is_active: isActive,
      },
    ])
    .select("id, username, email, role, is_active, created_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateAdminUser(adminId, { email, role, isActive }) {
  const payload = { updated_at: new Date().toISOString() };
  if (email !== undefined) payload.email = email.trim();
  if (role !== undefined) payload.role = role;
  if (isActive !== undefined) payload.is_active = isActive;

  const { data, error } = await supabase
    .from("admins")
    .update(payload)
    .eq("id", adminId)
    .select("id, username, email, role, is_active, updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteAdminUser(adminId) {
  const { error } = await supabase.from("admins").delete().eq("id", adminId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: adminId };
}

/* =========================================================================
   TRUST VALUE PROPOSITIONS CRUD
   ========================================================================= */

export async function fetchTrustPropsAdmin() {
  const { data, error } = await supabase
    .from("trust_value_propositions")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createTrustProp(propData) {
  const { titleEn, titleAr, descriptionEn, descriptionAr, icon = "ShieldCheck", linkUrl = null, sortOrder = 0, isActive = true } = propData;

  const { data, error } = await supabase
    .from("trust_value_propositions")
    .insert([
      {
        title_en: titleEn.trim(),
        title_ar: titleAr ? titleAr.trim() : titleEn.trim(),
        description_en: descriptionEn.trim(),
        description_ar: descriptionAr ? descriptionAr.trim() : descriptionEn.trim(),
        icon: icon,
        link_url: linkUrl || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateTrustProp(propId, propData) {
  const payload = {};
  if (propData.titleEn !== undefined) payload.title_en = propData.titleEn.trim();
  if (propData.titleAr !== undefined) payload.title_ar = propData.titleAr.trim();
  if (propData.descriptionEn !== undefined) payload.description_en = propData.descriptionEn.trim();
  if (propData.descriptionAr !== undefined) payload.description_ar = propData.descriptionAr.trim();
  if (propData.icon !== undefined) payload.icon = propData.icon;
  if (propData.linkUrl !== undefined) payload.link_url = propData.linkUrl || null;
  if (propData.sortOrder !== undefined) payload.sort_order = Number(propData.sortOrder);
  if (propData.isActive !== undefined) payload.is_active = propData.isActive;

  const { data, error } = await supabase
    .from("trust_value_propositions")
    .update(payload)
    .eq("id", propId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteTrustProp(propId) {
  const { error } = await supabase.from("trust_value_propositions").delete().eq("id", propId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: propId };
}

/* =========================================================================
   HERO SLIDES & PROMOTIONAL ADS CRUD
   ========================================================================= */

export async function fetchHeroSlidesAdmin() {
  const { data, error } = await supabase
    .from("hero_slides")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createHeroSlide(slideData) {
  const {
    titleEn,
    titleAr,
    subtitleEn,
    subtitleAr,
    tagBadgeEn,
    tagBadgeAr,
    desktopImage,
    mobileImage,
    primaryCtaTextEn,
    primaryCtaTextAr,
    primaryCtaLink,
    secondaryCtaTextEn,
    secondaryCtaTextAr,
    secondaryCtaLink,
    sortOrder = 0,
    isActive = true,
  } = slideData;

  const { data, error } = await supabase
    .from("hero_slides")
    .insert([
      {
        title_en: titleEn.trim(),
        title_ar: titleAr ? titleAr.trim() : titleEn.trim(),
        subtitle_en: subtitleEn || "",
        subtitle_ar: subtitleAr || subtitleEn || "",
        tag_badge_en: tagBadgeEn || null,
        tag_badge_ar: tagBadgeAr || null,
        desktop_image: desktopImage.trim(),
        mobile_image: mobileImage ? mobileImage.trim() : null,
        primary_cta_text_en: primaryCtaTextEn || "Explore Now",
        primary_cta_text_ar: primaryCtaTextAr || "استكشف الآن",
        primary_cta_link: primaryCtaLink || "/catalog",
        secondary_cta_text_en: secondaryCtaTextEn || null,
        secondary_cta_text_ar: secondaryCtaTextAr || null,
        secondary_cta_link: secondaryCtaLink || null,
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updateHeroSlide(slideId, slideData) {
  const updatePayload = { updated_at: new Date().toISOString() };
  if (slideData.titleEn !== undefined) updatePayload.title_en = slideData.titleEn;
  if (slideData.titleAr !== undefined) updatePayload.title_ar = slideData.titleAr;
  if (slideData.subtitleEn !== undefined) updatePayload.subtitle_en = slideData.subtitleEn;
  if (slideData.subtitleAr !== undefined) updatePayload.subtitle_ar = slideData.subtitleAr;
  if (slideData.tagBadgeEn !== undefined) updatePayload.tag_badge_en = slideData.tagBadgeEn;
  if (slideData.tagBadgeAr !== undefined) updatePayload.tag_badge_ar = slideData.tagBadgeAr;
  if (slideData.desktopImage !== undefined) updatePayload.desktop_image = slideData.desktopImage;
  if (slideData.mobileImage !== undefined) updatePayload.mobile_image = slideData.mobileImage;
  if (slideData.primaryCtaTextEn !== undefined) updatePayload.primary_cta_text_en = slideData.primaryCtaTextEn;
  if (slideData.primaryCtaTextAr !== undefined) updatePayload.primary_cta_text_ar = slideData.primaryCtaTextAr;
  if (slideData.primaryCtaLink !== undefined) updatePayload.primary_cta_link = slideData.primaryCtaLink;
  if (slideData.secondaryCtaTextEn !== undefined) updatePayload.secondary_cta_text_en = slideData.secondaryCtaTextEn;
  if (slideData.secondaryCtaTextAr !== undefined) updatePayload.secondary_cta_text_ar = slideData.secondaryCtaTextAr;
  if (slideData.secondaryCtaLink !== undefined) updatePayload.secondary_cta_link = slideData.secondaryCtaLink;
  if (slideData.sortOrder !== undefined) updatePayload.sort_order = Number(slideData.sortOrder);
  if (slideData.isActive !== undefined) updatePayload.is_active = slideData.isActive;

  const { data, error } = await supabase
    .from("hero_slides")
    .update(updatePayload)
    .eq("id", slideId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteHeroSlide(slideId) {
  const { error } = await supabase.from("hero_slides").delete().eq("id", slideId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: slideId };
}

export async function fetchPromotionalAdsAdmin() {
  const { data, error } = await supabase
    .from("promotional_ads")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: false });

  if (error) throw new Error(error.message);
  return data || [];
}

export async function createPromotionalAd(adData) {
  const {
    titleEn,
    titleAr,
    subtitleEn,
    subtitleAr,
    badgeTextEn,
    badgeTextAr,
    desktopImage,
    mobileImage,
    ctaTextEn,
    ctaTextAr,
    ctaLink,
    sortOrder = 0,
    isActive = true,
  } = adData;

  const { data, error } = await supabase
    .from("promotional_ads")
    .insert([
      {
        title_en: titleEn.trim(),
        title_ar: titleAr ? titleAr.trim() : titleEn.trim(),
        subtitle_en: subtitleEn || "",
        subtitle_ar: subtitleAr || subtitleEn || "",
        badge_text_en: badgeTextEn || null,
        badge_text_ar: badgeTextAr || null,
        desktop_image: desktopImage ? desktopImage.trim() : "",
        mobile_image: mobileImage ? mobileImage.trim() : null,
        cta_text_en: ctaTextEn || "Shop Deals",
        cta_text_ar: ctaTextAr || "تسوق العروض",
        cta_link: ctaLink || "/catalog",
        sort_order: Number(sortOrder) || 0,
        is_active: isActive,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function updatePromotionalAd(adId, adData) {
  const updatePayload = { updated_at: new Date().toISOString() };
  if (adData.titleEn !== undefined) updatePayload.title_en = adData.titleEn;
  if (adData.titleAr !== undefined) updatePayload.title_ar = adData.titleAr;
  if (adData.subtitleEn !== undefined) updatePayload.subtitle_en = adData.subtitleEn;
  if (adData.subtitleAr !== undefined) updatePayload.subtitle_ar = adData.subtitleAr;
  if (adData.badgeTextEn !== undefined) updatePayload.badge_text_en = adData.badgeTextEn;
  if (adData.badgeTextAr !== undefined) updatePayload.badge_text_ar = adData.badgeTextAr;
  if (adData.desktopImage !== undefined) updatePayload.desktop_image = adData.desktopImage;
  if (adData.mobileImage !== undefined) updatePayload.mobile_image = adData.mobileImage;
  if (adData.ctaTextEn !== undefined) updatePayload.cta_text_en = adData.ctaTextEn;
  if (adData.ctaTextAr !== undefined) updatePayload.cta_text_ar = adData.ctaTextAr;
  if (adData.ctaLink !== undefined) updatePayload.cta_link = adData.ctaLink;
  if (adData.sortOrder !== undefined) updatePayload.sort_order = Number(adData.sortOrder);
  if (adData.isActive !== undefined) updatePayload.is_active = adData.isActive;

  const { data, error } = await supabase
    .from("promotional_ads")
    .update(updatePayload)
    .eq("id", adId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deletePromotionalAd(adId) {
  const { error } = await supabase.from("promotional_ads").delete().eq("id", adId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: adId };
}

/* =========================================================================
   AI ASSISTANT CONFIG
   ========================================================================= */

export async function fetchAiConfigAdmin() {
  const { data, error } = await supabase
    .from("ai_assistant_configs")
    .select("*")
    .limit(1)
    .single();

  if (error && error.code !== "PGRST116") throw new Error(error.message);
  return data || null;
}

export async function updateAiConfigAdmin(configId, configData) {
  const { data, error } = await supabase
    .from("ai_assistant_configs")
    .update({
      ...configData,
      updated_at: new Date().toISOString(),
    })
    .eq("id", configId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
