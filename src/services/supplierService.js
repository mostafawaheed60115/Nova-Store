import { supabase } from "../lib/supabaseClient";

const SUPPLIER_STORAGE_KEY = "nova_supplier_session";

/**
 * Authenticates supplier against public.suppliers using verify_supplier_password RPC
 */
export async function loginSupplier(identifier, password) {
  const { data, error } = await supabase.rpc("verify_supplier_password", {
    p_identifier: identifier.trim(),
    p_password: password,
  });

  if (error) {
    throw new Error(`Supplier Authentication Failed: ${error.message}`);
  }

  if (!data || data.length === 0) {
    throw new Error("Invalid supplier phone/email or password.");
  }

  const supplier = data[0];
  try {
    sessionStorage.setItem(SUPPLIER_STORAGE_KEY, JSON.stringify(supplier));
  } catch {
    /* ignore */
  }

  return supplier;
}

export function getCurrentSupplier() {
  try {
    const saved = sessionStorage.getItem(SUPPLIER_STORAGE_KEY);
    return saved ? JSON.parse(saved) : null;
  } catch {
    return null;
  }
}

export function logoutSupplier() {
  try {
    sessionStorage.removeItem(SUPPLIER_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/**
 * Supplier changes own password
 */
export async function changeSupplierOwnPassword(supplierId, oldPassword, newPassword) {
  if (!oldPassword) throw new Error("Current password is required.");
  if (!newPassword || newPassword.length < 6) throw new Error("New password must be at least 6 characters.");

  const { data, error } = await supabase.rpc("change_supplier_own_password", {
    p_supplier_id: Number(supplierId),
    p_old_password: oldPassword,
    p_new_password: newPassword,
  });

  if (error) throw new Error(error.message);
  return { success: true, data };
}

/**
 * Fetches supplier performance metrics & financial statements
 */
export async function fetchSupplierMetrics(supplierId) {
  const { data: subOrders, error } = await supabase
    .from("sub_orders")
    .select("*")
    .eq("supplier_id", supplierId);

  if (error) {
    throw new Error(`Failed to fetch supplier metrics: ${error.message}`);
  }

  const orders = subOrders || [];
  const pendingCount = orders.filter((o) => o.status === "pending" || o.status === "accepted_by_supplier").length;
  const readyForPickup = orders.filter((o) => o.status === "ready_for_pickup").length;
  const fulfilledCount = orders.filter((o) => o.status === "delivered").length;

  const totalVendorEarned = orders
    .filter((o) => o.status !== "cancelled")
    .reduce((sum, o) => sum + Number(o.supplier_vendor_cost || 0), 0);

  const pendingPayout = orders
    .filter((o) => o.supplier_payout_status === "pending" || o.supplier_payout_status === "eligible")
    .reduce((sum, o) => sum + Number(o.supplier_vendor_cost || 0), 0);

  const paidPayout = orders
    .filter((o) => o.supplier_payout_status === "paid")
    .reduce((sum, o) => sum + Number(o.supplier_vendor_cost || 0), 0);

  return {
    totalSubOrders: orders.length,
    pendingCount,
    readyForPickup,
    fulfilledCount,
    totalVendorEarned,
    pendingPayout,
    paidPayout,
  };
}

/**
 * Fetches sub-orders assigned to this supplier with order items and customer shipping details
 */
export async function fetchSupplierSubOrders(supplierId) {
  const { data, error } = await supabase
    .from("sub_orders")
    .select(`
      *,
      orders (
        id,
        order_code,
        customer_name,
        customer_phone,
        shipping_address,
        notes,
        created_at
      ),
      order_items (*)
    `)
    .eq("supplier_id", supplierId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch supplier sub-orders: ${error.message}`);
  }
  return data || [];
}

/**
 * Updates supplier fulfillment status, courier assignment, and tracking with strict supplier_id ownership
 */
export async function updateSupplierFulfillment(supplierId, subOrderId, { status, courierName, trackingNumber }) {
  const updateData = { updated_at: new Date().toISOString() };
  if (status) updateData.status = status;
  if (courierName !== undefined) updateData.courier_name = courierName;
  if (trackingNumber !== undefined) updateData.courier_tracking_number = trackingNumber;

  const { data, error } = await supabase
    .from("sub_orders")
    .update(updateData)
    .eq("id", subOrderId)
    .eq("supplier_id", supplierId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update fulfillment: ${error.message}`);
  }
  return data;
}

/* =========================================================================
   SUPPLIER CATALOG (PRODUCTS, VARIANTS, IMAGES) CRUD
   ========================================================================= */

/**
 * Fetches products and variants belonging exclusively to this supplier
 */
export async function fetchSupplierCatalog(supplierId) {
  const { data, error } = await supabase
    .from("products")
    .select(`
      *,
      subcategories (id, name_ar, name_en, slug, categories(id, name_ar, name_en)),
      product_imgs (*)
    `)
    .eq("supplier_id", supplierId)
    .order("id", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch supplier products: ${error.message}`);
  }
  return data || [];
}

/**
 * Fetches subcategories list for supplier product creation
 */
export async function fetchSupplierSubcategories() {
  const { data, error } = await supabase
    .from("subcategories")
    .select("*, categories(id, name_en, name_ar)")
    .eq("is_active", true)
    .order("name_en", { ascending: true });

  if (error) throw new Error(error.message);
  return data || [];
}

/**
 * Supplier creates a new product in their own catalog
 */
export async function createSupplierProduct(supplierId, productData) {
  const {
    nameEn,
    nameAr,
    descriptionEn,
    descriptionAr,
    subcategoryId,
    condition = "new",
    vendorPrice = 0,
    salePrice = null,
    stockQuantity = 10,
    imgLink,
    isActive = true,
    images = [],
  } = productData;

  const vCost = Number(vendorPrice) || 0;
  const vSale = salePrice ? Number(salePrice) : Math.round(vCost * 1.18);

  const { data: product, error: prodError } = await supabase
    .from("products")
    .insert([
      {
        supplier_id: Number(supplierId),
        subcategory_id: Number(subcategoryId) || 1,
        name_en: nameEn.trim(),
        name_ar: nameAr ? nameAr.trim() : nameEn.trim(),
        description_en: descriptionEn || "",
        description_ar: descriptionAr || descriptionEn || "",
        condition: condition,
        vendor_price: vCost,
        sale_price: vSale,
        stock_quantity: Number(stockQuantity) || 0,
        is_active: isActive !== false,
      },
    ])
    .select()
    .single();

  if (prodError) throw new Error(prodError.message);

  // Insert Images
  if (Array.isArray(images) && images.length > 0) {
    const imgRows = images.map((img, idx) => ({
      product_id: product.id,
      variant_id: null,
      img_link: typeof img === "string" ? img : img.imgLink || img.url,
      is_primary: idx === 0 || Boolean(img.isPrimary),
      sort_order: idx + 1,
    }));

    await supabase.from("product_imgs").insert(imgRows);
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

/**
 * Supplier updates their own product details
 */
export async function updateSupplierProduct(supplierId, productId, productData) {
  const updatePayload = { updated_at: new Date().toISOString() };
  if (productData.nameEn !== undefined) updatePayload.name_en = productData.nameEn.trim();
  if (productData.nameAr !== undefined) updatePayload.name_ar = productData.nameAr.trim();
  if (productData.descriptionEn !== undefined) updatePayload.description_en = productData.descriptionEn;
  if (productData.descriptionAr !== undefined) updatePayload.description_ar = productData.descriptionAr;
  if (productData.subcategoryId !== undefined) updatePayload.subcategory_id = Number(productData.subcategoryId);
  if (productData.condition !== undefined) updatePayload.condition = productData.condition;
  if (productData.salePrice !== undefined) updatePayload.sale_price = Number(productData.salePrice);
  if (productData.vendorPrice !== undefined) updatePayload.vendor_price = Number(productData.vendorPrice);
  if (productData.stockQuantity !== undefined) updatePayload.stock_quantity = Number(productData.stockQuantity);
  if (productData.isActive !== undefined) updatePayload.is_active = productData.isActive;

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", productId)
    .eq("supplier_id", supplierId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Supplier deletes their own product
 */
export async function deleteSupplierProduct(supplierId, productId) {
  // Check ownership
  const { data: prod, error: checkErr } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("supplier_id", supplierId)
    .single();

  if (checkErr || !prod) {
    throw new Error("Product not found or unauthorized.");
  }

  // Check if ordered
  const { data: ordered } = await supabase.from("order_items").select("id").eq("product_id", productId).limit(1);
  if (ordered && ordered.length > 0) {
    // Soft delete to protect history
    await supabase.from("products").update({ is_active: false, updated_at: new Date().toISOString() }).eq("id", productId);
    return { success: true, deletedId: productId, softDeleted: true };
  }

  await supabase.from("coupon_targeted_items").delete().eq("target_type", "product").eq("target_id", productId);
  await supabase.from("product_offers").delete().eq("product_id", productId);
  await supabase.from("product_imgs").delete().eq("product_id", productId);

  const { error } = await supabase.from("products").delete().eq("id", productId).eq("supplier_id", supplierId);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: productId };
}

/**
 * Supplier updates product stock, vendor price, and sale price directly
 */
export async function updateProductInventory(supplierId, productId, { stockQuantity, vendorPrice, salePrice, isActive }) {
  const updateData = { updated_at: new Date().toISOString() };
  if (stockQuantity !== undefined) updateData.stock_quantity = Number(stockQuantity);
  if (vendorPrice !== undefined) updateData.vendor_price = Number(vendorPrice);
  if (salePrice !== undefined) updateData.sale_price = Number(salePrice);
  if (isActive !== undefined) updateData.is_active = isActive;

  const { data, error } = await supabase
    .from("products")
    .update(updateData)
    .eq("id", productId)
    .eq("supplier_id", supplierId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product inventory: ${error.message}`);
  }
  return data;
}

/**
 * Supplier adds an image to their product
 */
export async function addSupplierProductImage(supplierId, productId, { imgLink, isPrimary = false, variantId = null }) {
  const { data: prod } = await supabase.from("products").select("id").eq("id", productId).eq("supplier_id", supplierId).single();
  if (!prod) throw new Error("Unauthorized product image upload.");

  if (isPrimary) {
    await supabase.from("product_imgs").update({ is_primary: false }).eq("product_id", productId);
  }

  const { data, error } = await supabase
    .from("product_imgs")
    .insert([
      {
        product_id: productId,
        variant_id: variantId,
        img_link: imgLink.trim(),
        is_primary: isPrimary,
        sort_order: 0,
      },
    ])
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Supplier deletes an image from their product
 */
export async function deleteSupplierProductImage(supplierId, imageId) {
  const { data: image, error: imageError } = await supabase
    .from("product_imgs")
    .select("id, product_id, products!inner(supplier_id)")
    .eq("id", imageId)
    .eq("products.supplier_id", supplierId)
    .single();

  if (imageError || !image) throw new Error("Image not found or unauthorized.");

  const { error } = await supabase.from("product_imgs").delete().eq("id", image.id);
  if (error) throw new Error(error.message);
  return { success: true, deletedId: imageId };
}

/* =========================================================================
   SUPPLIER SHIPPING & RETURN POLICIES
   ========================================================================= */

/**
 * Fetches supplier shipping and return policies
 */
export async function fetchSupplierPolicies(supplierId) {
  const [shippingRes, returnRes] = await Promise.allSettled([
    supabase
      .from("supplier_shipping_policies")
      .select("*")
      .eq("supplier_id", supplierId)
      .order("id", { ascending: true }),
    supabase
      .from("supplier_return_exchange_policies")
      .select("*")
      .eq("supplier_id", supplierId)
      .maybeSingle(),
  ]);

  const shippingPolicies = shippingRes.status === "fulfilled" && shippingRes.value.data ? shippingRes.value.data : [];
  const returnPolicy = returnRes.status === "fulfilled" && returnRes.value.data ? returnRes.value.data : null;

  return { shippingPolicies, returnPolicy };
}

/**
 * Updates supplier return and exchange policies
 */
export async function updateSupplierReturnPolicy(supplierId, policyData) {
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

/** Creates or replaces the supplier's single storewide shipping policy. */
export async function createShippingPolicy(supplierId, policyData) {
  const { shippingCost, estimatedDaysMin = 1, estimatedDaysMax = 3, isActive = true } = policyData;

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

export async function updateShippingPolicy(supplierId, policyId, policyData) {
  const updatePayload = {};
  if (policyData.shippingCost !== undefined) updatePayload.shipping_cost = Number(policyData.shippingCost);
  if (policyData.estimatedDaysMin !== undefined) updatePayload.estimated_days_min = Number(policyData.estimatedDaysMin);
  if (policyData.estimatedDaysMax !== undefined) updatePayload.estimated_days_max = Number(policyData.estimatedDaysMax);
  if (policyData.isActive !== undefined) updatePayload.is_active = policyData.isActive;

  const { data, error } = await supabase
    .from("supplier_shipping_policies")
    .update(updatePayload)
    .eq("id", policyId)
    .eq("supplier_id", supplierId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function deleteShippingPolicy(supplierId, policyId) {
  const { error } = await supabase
    .from("supplier_shipping_policies")
    .delete()
    .eq("id", policyId)
    .eq("supplier_id", supplierId);

  if (error) throw new Error(error.message);
  return { success: true, deletedId: policyId };
}
