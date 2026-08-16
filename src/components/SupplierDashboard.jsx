import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import {
  loginSupplier,
  getCurrentSupplier,
  logoutSupplier,
  fetchSupplierMetrics,
  fetchSupplierSubOrders,
  updateSupplierFulfillment,
  fetchSupplierCatalog,
  fetchSupplierSubcategories,
  createSupplierProduct,
  updateSupplierProduct,
  deleteSupplierProduct,
  updateProductInventory,
  addSupplierProductImage,
  deleteSupplierProductImage,
  fetchSupplierPolicies,
  updateSupplierReturnPolicy,
  createShippingPolicy,
  updateShippingPolicy,
  deleteShippingPolicy,
  changeSupplierOwnPassword,
} from "../services/supplierService";
import DataTable from "./DataTable";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import {
  Building,
  Truck,
  DollarSign,
  Settings,
  ArrowRight,
  RefreshCw,
  LogOut,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Boxes,
  Save,
  Plus,
  Trash2,
  Edit2,
  X,
  Key,
  Lock,
  Image as ImageIcon,
  UploadCloud,
  Loader2,
  SlidersHorizontal,
  Package,
} from "lucide-react";
import { uploadImageToSupabase } from "../utils/imageConverter";

export default function SupplierDashboard() {
  const [supplier, setSupplier] = useState(getCurrentSupplier());
  const [identifier, setIdentifier] = useState("nova");
  const [password, setPassword] = useState("AnAelwelf17##");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab: 'fulfillment' | 'products' | 'inventory' | 'shipping' | 'policies' | 'financials'
  const [activeTab, setActiveTab] = useState("fulfillment");

  // Metrics State
  const [metrics, setMetrics] = useState(null);

  // Sub-Orders State
  const [subOrders, setSubOrders] = useState([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Catalog & Products State
  const [catalog, setCatalog] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  // Product Create / Edit Modal State
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [productForm, setProductForm] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    subcategoryId: "",
    condition: "new",
    salePrice: "",
    vendorPrice: "",
    stockQuantity: 10,
    isFeatured: false,
    isActive: true,
    images: [],
  });
  const [isSavingProduct, setIsSavingProduct] = useState(false);

  // Inventory Edit State
  const [editingProductId, setEditingProductId] = useState(null);
  const [editStock, setEditStock] = useState("");
  const [editCost, setEditCost] = useState("");
  const [editSalePrice, setEditSalePrice] = useState("");

  // Shipping Policies State
  const [shippingPolicies, setShippingPolicies] = useState([]);
  const [isLoadingShipping, setIsLoadingShipping] = useState(false);
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [editingShippingPolicy, setEditingShippingPolicy] = useState(null);
  const [shippingForm, setShippingForm] = useState({
    shippingCost: 35,
    estimatedDaysMin: 1,
    estimatedDaysMax: 3,
    isActive: true,
  });

  // Return & Warranty Policies State
  const [returnDays, setReturnDays] = useState(14);
  const [warrantyMonths, setWarrantyMonths] = useState(24);
  const [conditionsEn, setConditionsEn] = useState("");
  const [conditionsAr, setConditionsAr] = useState("");
  const [isSavingPolicy, setIsSavingPolicy] = useState(false);

  // Supplier Change Password Modal State
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    onConfirm: () => {},
  });

  const { addToast, navigateTo } = useStore();
  const { lang } = useLanguage();
  const isAr = lang === "ar";

  const loadSupplierData = useCallback(async () => {
    if (!supplier) return;
    setIsLoadingOrders(true);
    setIsLoadingCatalog(true);
    setIsLoadingShipping(true);

    try {
      const [m, orders, cat, pol, subs] = await Promise.allSettled([
        fetchSupplierMetrics(supplier.id),
        fetchSupplierSubOrders(supplier.id),
        fetchSupplierCatalog(supplier.id),
        fetchSupplierPolicies(supplier.id),
        fetchSupplierSubcategories(),
      ]);

      if (m.status === "fulfilled") setMetrics(m.value);
      if (orders.status === "fulfilled") setSubOrders(orders.value || []);
      if (cat.status === "fulfilled") setCatalog(cat.value || []);
      if (subs.status === "fulfilled") setSubcategories(subs.value || []);
      if (pol.status === "fulfilled") {
        if (pol.value.shippingPolicies) {
          setShippingPolicies(pol.value.shippingPolicies);
        }
        if (pol.value.returnPolicy) {
          setReturnDays(pol.value.returnPolicy.return_days || 14);
          setWarrantyMonths(pol.value.returnPolicy.warranty_months || 24);
          setConditionsEn(pol.value.returnPolicy.conditions_en || "");
          setConditionsAr(pol.value.returnPolicy.conditions_ar || "");
        }
      }
    } catch (err) {
      console.error("Supplier data load error:", err);
      addToast("Failed to load supplier data: " + err.message, "error");
    } finally {
      setIsLoadingOrders(false);
      setIsLoadingCatalog(false);
      setIsLoadingShipping(false);
    }
  }, [supplier, addToast]);

  useEffect(() => {
    if (supplier) {
      loadSupplierData();
    }
  }, [supplier, loadSupplierData]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const logged = await loginSupplier(identifier, password);
      setSupplier(logged);
      addToast(isAr ? "تم تسجيل دخول المورد بنجاح!" : "Logged into Supplier Fulfillment Hub!", "success");
    } catch (err) {
      setAuthError(err.message || "Invalid supplier credentials");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logoutSupplier();
    setSupplier(null);
    addToast(isAr ? "تم تسجيل الخروج" : "Logged out from supplier portal", "info");
  };

  // Fulfillment Status Progression
  const handleFulfillmentStatusChange = async (subOrderId, newStatus) => {
    try {
      await updateSupplierFulfillment(supplier.id, subOrderId, { status: newStatus });
      addToast(`Fulfillment stage updated to ${newStatus}`, "success");
      const updated = await fetchSupplierSubOrders(supplier.id);
      setSubOrders(updated);
      const m = await fetchSupplierMetrics(supplier.id);
      setMetrics(m);
    } catch (err) {
      addToast(`Fulfillment update failed: ${err.message}`, "error");
    }
  };

  // Courier Dispatch Assignment
  const handleCourierAssign = async (subOrderId, courierName, trackingNumber) => {
    try {
      await updateSupplierFulfillment(supplier.id, subOrderId, {
        status: "picked_up",
        courierName: courierName || "Bosta Express",
        trackingNumber: trackingNumber || `TRK-${Date.now().toString().slice(-6)}`,
      });
      addToast("Courier details assigned & package marked Picked Up!", "success");
      const updated = await fetchSupplierSubOrders(supplier.id);
      setSubOrders(updated);
      const m = await fetchSupplierMetrics(supplier.id);
      setMetrics(m);
    } catch (err) {
      addToast(`Failed to assign courier: ${err.message}`, "error");
    }
  };

  /* ──────────────── SUPPLIER PRODUCT CRUD ──────────────── */
  const handleUploadSupplierImageFiles = async (files) => {
    if (!files || files.length === 0) return;
    setIsUploadingImages(true);
    try {
      const fileList = Array.from(files);
      const uploadedList = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        if (!file.type.startsWith("image/")) continue;
        const publicUrl = await uploadImageToSupabase(file, "products", "store-media");
        uploadedList.push({
          tempId: `up_${Date.now()}_${i}`,
          url: publicUrl,
          isPrimary: false,
        });
      }

      if (uploadedList.length === 0) {
        addToast("Please select valid image files.", "warning");
        return;
      }

      setProductForm((prev) => {
        const currentImgs = prev.images || [];
        const hasPrimary = currentImgs.some((x) => x.isPrimary);
        const newFormatted = uploadedList.map((x, idx) => ({
          ...x,
          isPrimary: !hasPrimary && idx === 0,
        }));
        return {
          ...prev,
          images: [...currentImgs, ...newFormatted],
        };
      });
      addToast(`Uploaded ${uploadedList.length} WebP image(s)!`, "success");
    } catch (err) {
      console.error("Upload error:", err);
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleOpenProductModal = (prod = null) => {
    if (prod) {
      setEditingProduct(prod);
      setProductForm({
        nameEn: prod.name_en || "",
        nameAr: prod.name_ar || "",
        descriptionEn: prod.description_en || "",
        descriptionAr: prod.description_ar || "",
        subcategoryId: prod.subcategory_id || "",
        condition: prod.condition || "new",
        salePrice: prod.sale_price !== undefined ? prod.sale_price : "",
        vendorPrice: prod.vendor_price !== undefined ? prod.vendor_price : "",
        stockQuantity: prod.stock_quantity !== undefined ? prod.stock_quantity : 10,
        isFeatured: Boolean(prod.is_featured),
        isActive: prod.is_active !== false,
        images: (prod.product_imgs || []).map((img) => ({
          id: img.id,
          url: img.img_link,
          isPrimary: Boolean(img.is_primary),
        })),
      });
    } else {
      setEditingProduct(null);
      setProductForm({
        nameEn: "",
        nameAr: "",
        descriptionEn: "",
        descriptionAr: "",
        subcategoryId: subcategories[0]?.id || "",
        condition: "new",
        salePrice: "",
        vendorPrice: "",
        stockQuantity: 10,
        isFeatured: false,
        isActive: true,
        images: [],
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!supplier) return;
    if (!productForm.salePrice || Number(productForm.salePrice) <= 0) {
      addToast("Please enter a valid retail sale price in EGP.", "error");
      return;
    }

    setIsSavingProduct(true);
    try {
      if (editingProduct) {
        await updateSupplierProduct(supplier.id, editingProduct.id, {
          nameEn: productForm.nameEn,
          nameAr: productForm.nameAr,
          descriptionEn: productForm.descriptionEn,
          descriptionAr: productForm.descriptionAr,
          subcategoryId: productForm.subcategoryId ? Number(productForm.subcategoryId) : null,
          condition: productForm.condition,
          salePrice: Number(productForm.salePrice),
          vendorPrice: Number(productForm.vendorPrice || 0),
          stockQuantity: Number(productForm.stockQuantity || 0),
          isFeatured: productForm.isFeatured,
          isActive: productForm.isActive,
        });
        addToast("Product updated successfully!", "success");
      } else {
        await createSupplierProduct(supplier.id, productForm);
        addToast("New product added to your catalog!", "success");
      }
      setIsProductModalOpen(false);
      const updatedCat = await fetchSupplierCatalog(supplier.id);
      setCatalog(updatedCat);
    } catch (err) {
      addToast(`Failed to save product: ${err.message}`, "error");
    } finally {
      setIsSavingProduct(false);
    }
  };

  const handleDeleteProduct = (prod) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Product "${prod.name_en}"?`,
      message: "Are you sure you want to remove this product from your store catalog?",
      confirmLabel: "Delete Product",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteSupplierProduct(supplier.id, prod.id);
          addToast("Product deleted from catalog", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updatedCat = await fetchSupplierCatalog(supplier.id);
          setCatalog(updatedCat);
        } catch (err) {
          addToast(`Failed to delete product: ${err.message}`, "error");
        }
      },
    });
  };

  // Inventory Quick Edit
  const handleSaveInventory = async (productId) => {
    try {
      await updateProductInventory(supplier.id, productId, {
        stockQuantity: editStock,
        vendorPrice: editCost,
        salePrice: editSalePrice,
      });
      addToast("Inventory stock and prices saved!", "success");
      setEditingProductId(null);
      const updatedCat = await fetchSupplierCatalog(supplier.id);
      setCatalog(updatedCat);
    } catch (err) {
      addToast(`Inventory update failed: ${err.message}`, "error");
    }
  };

  // Storewide shipping policy handlers
  const handleOpenShippingModal = (policy = null) => {
    if (policy) {
      setEditingShippingPolicy(policy);
      setShippingForm({
        shippingCost: policy.shipping_cost,
        estimatedDaysMin: policy.estimated_days_min || 1,
        estimatedDaysMax: policy.estimated_days_max || 3,
        isActive: policy.is_active !== false,
      });
    } else {
      setEditingShippingPolicy(null);
      setShippingForm({
        shippingCost: 35,
        estimatedDaysMin: 1,
        estimatedDaysMax: 3,
        isActive: true,
      });
    }
    setIsShippingModalOpen(true);
  };

  const handleSaveShippingPolicy = async (e) => {
    e.preventDefault();
    try {
      if (editingShippingPolicy) {
        await updateShippingPolicy(supplier.id, editingShippingPolicy.id, shippingForm);
        addToast("Shipping rate updated!", "success");
      } else {
        await createShippingPolicy(supplier.id, shippingForm);
        addToast("New shipping rate added!", "success");
      }
      setIsShippingModalOpen(false);
      const pol = await fetchSupplierPolicies(supplier.id);
      setShippingPolicies(pol.shippingPolicies || []);
    } catch (err) {
      addToast(`Failed to save shipping rate: ${err.message}`, "error");
    }
  };

  const handleDeleteShippingPolicy = (policy) => {
    setConfirmDialog({
      isOpen: true,
      title: "Remove Shipping Rate?",
      message: "Delete the storewide shipping policy?",
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteShippingPolicy(supplier.id, policy.id);
          addToast("Shipping policy removed", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const pol = await fetchSupplierPolicies(supplier.id);
          setShippingPolicies(pol.shippingPolicies || []);
        } catch (err) {
          addToast(`Failed to delete policy: ${err.message}`, "error");
        }
      },
    });
  };

  // Return Policy Update
  const handleSavePolicy = async (e) => {
    e.preventDefault();
    setIsSavingPolicy(true);
    try {
      await updateSupplierReturnPolicy(supplier.id, {
        return_days: Number(returnDays),
        warranty_months: Number(warrantyMonths),
        conditions_en: conditionsEn,
        conditions_ar: conditionsAr,
        return_allowed: true,
        exchange_allowed: true,
      });
      addToast("Return & Warranty policies updated!", "success");
    } catch (err) {
      addToast(`Failed to update policy: ${err.message}`, "error");
    } finally {
      setIsSavingPolicy(false);
    }
  };

  // Supplier Change Own Password
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!oldPassword || !newPassword) {
      addToast("Please fill in both current and new password fields.", "warning");
      return;
    }
    if (newPassword.length < 6) {
      addToast("New password must be at least 6 characters.", "warning");
      return;
    }
    if (newPassword !== confirmPassword) {
      addToast("New password and confirmation do not match.", "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeSupplierOwnPassword(supplier.id, oldPassword, newPassword);
      addToast("Password changed successfully! Please use it next time you login.", "success");
      setIsPasswordModalOpen(false);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      addToast(`Password change failed: ${err.message}`, "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const filteredSubOrders = useMemo(() => {
    if (statusFilter === "all") return subOrders;
    return subOrders.filter((o) => o.status === statusFilter);
  }, [subOrders, statusFilter]);

  /* ─────────────────────────────────────────────────────────────
     UNAUTHENTICATED VIEW (SUPPLIER LOGIN)
  ───────────────────────────────────────────────────────────── */
  if (!supplier) {
    return (
      <div className="dashboard-login-screen">
        <motion.div
          className="dashboard-login-card supplier"
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <img
            src="/Assets/no bg logo.png"
            alt="Nova Store"
            style={{ width: 68, height: 68, objectFit: "contain", margin: "0 auto 1.25rem", display: "block" }}
          />
          <div className="login-badge-pill supplier">
            <Building size={15} /> Supplier Operations Portal
          </div>
          <h2>Nova Supplier Hub</h2>
          <p>Sign in with your registered phone number or email and secret password.</p>

          {authError && <div className="admin-auth-error">{authError}</div>}

          <form onSubmit={handleLogin} className="admin-form">
            <div className="form-group">
              <label>Registered Phone Number or Email</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="nova or supplier@novastore.com"
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-full" disabled={isLoggingIn}>
              {isLoggingIn ? "Logging in..." : "Open Supplier Hub"} <ArrowRight size={16} />
            </button>
          </form>

          <div className="login-footer-actions">
            <button onClick={() => navigateTo("home")} className="return-store-link">
              <ArrowLeft size={15} /> Return to Storefront
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     AUTHENTICATED SUPPLIER DASHBOARD VIEW
  ───────────────────────────────────────────────────────────── */
  return (
    <div className="dashboard-app-wrapper">
      {/* ─── Top Bar ─── */}
      <header className="dashboard-topbar supplier">
        <div className="topbar-left">
          <button onClick={() => navigateTo("home")} className="topbar-store-btn">
            <ArrowLeft size={16} />
            <span>Storefront</span>
          </button>
          <div className="topbar-divider" />
          <div className="topbar-title-block" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/Assets/no bg logo.png"
              alt="Nova Store"
              style={{ width: 34, height: 34, objectFit: "contain" }}
            />
            <div>
              <span className="topbar-badge supplier">Supplier Fulfillment Center</span>
              <h2>{supplier.name}</h2>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-user-badge">
            <div className="user-avatar-dot supplier" />
            <span>Supplier account</span>
          </div>

          <button
            onClick={() => setIsPasswordModalOpen(true)}
            className="topbar-icon-btn"
            title="Change Password"
            style={{ color: "#F59E0B" }}
          >
            <Key size={16} />
          </button>

          <button onClick={loadSupplierData} className="topbar-icon-btn" title="Refresh Live Orders">
            <RefreshCw size={16} />
          </button>

          <button onClick={handleLogout} className="topbar-logout-btn" title="Sign Out">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* ─── Dashboard Body Layout ─── */}
      <div className="dashboard-body-layout">
        {/* Sidebar Navigation */}
        <aside className="dashboard-sidebar">
          <nav className="dashboard-nav-list">
            <button
              className={`dashboard-nav-item ${activeTab === "fulfillment" ? "active" : ""}`}
              onClick={() => setActiveTab("fulfillment")}
            >
              <Truck size={18} />
              <span>Fulfillment Queue</span>
              {metrics?.pendingCount > 0 && (
                <span className="nav-counter-pill">{metrics.pendingCount}</span>
              )}
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <Package size={18} />
              <span>My Products</span>
              <span className="nav-counter-pill" style={{ background: "#3B82F6" }}>
                {catalog.length}
              </span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "inventory" ? "active" : ""}`}
              onClick={() => setActiveTab("inventory")}
            >
              <Boxes size={18} />
              <span>Stock & Prices</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "shipping" ? "active" : ""}`}
              onClick={() => setActiveTab("shipping")}
            >
              <Truck size={18} />
              <span>Storewide Shipping</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "policies" ? "active" : ""}`}
              onClick={() => setActiveTab("policies")}
            >
              <Settings size={18} />
              <span>Return & Warranty</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "financials" ? "active" : ""}`}
              onClick={() => setActiveTab("financials")}
            >
              <DollarSign size={18} />
              <span>Earnings & Payouts</span>
            </button>
          </nav>
        </aside>

        {/* Main Content Area */}
        <main className="dashboard-main-content">
          {/* ──────────────── TAB 1: FULFILLMENT QUEUE ──────────────── */}
          {activeTab === "fulfillment" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Assigned Sub-Orders & Dispatch Pipeline</h3>
                  <p>Prepare item packages, assign courier tracking, and update dispatch milestones.</p>
                </div>

                <div className="filter-pill-group">
                  {["all", "pending", "accepted_by_supplier", "ready_for_pickup", "picked_up", "delivered"].map((st) => (
                    <button
                      key={st}
                      className={`filter-pill-btn ${statusFilter === st ? "active" : ""}`}
                      onClick={() => setStatusFilter(st)}
                    >
                      {st.replace(/_/g, " ").toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {/* KPI Metrics */}
              <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="kpi-card">
                  <div className="kpi-icon-wrapper orders">
                    <Clock size={24} color="var(--blue-bell)" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">To Prepare & Pack</span>
                    <h4 className="kpi-value">{metrics?.pendingCount || 0}</h4>
                    <span className="kpi-subtext highlight">Awaiting fulfillment</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper suppliers">
                    <Truck size={24} color="#7C3AED" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Ready for Courier Pickup</span>
                    <h4 className="kpi-value">{metrics?.readyForPickup || 0}</h4>
                    <span className="kpi-subtext">Packed at Hub</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper revenue">
                    <DollarSign size={24} color="#059669" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Vendor Cost Earned</span>
                    <h4 className="kpi-value">{metrics?.totalVendorEarned?.toLocaleString() || "0"} EGP</h4>
                    <span className="kpi-subtext positive">Total item revenue</span>
                  </div>
                </div>
              </div>

              {/* Sub-Orders List */}
              {isLoadingOrders ? (
                <div className="orders-loading">Loading assigned sub-orders...</div>
              ) : filteredSubOrders.length === 0 ? (
                <div className="orders-empty">No sub-orders matching "{statusFilter}".</div>
              ) : (
                <div className="master-orders-list">
                  {filteredSubOrders.map((sub) => (
                    <div key={sub.id} className="master-order-card">
                      <div className="master-order-header">
                        <div>
                          <span className="order-code-text">{sub.sub_order_code}</span>
                          <span className="order-customer-text">
                            Main Order: #{sub.orders?.order_code} • Customer: {sub.orders?.customer_name} ({sub.orders?.customer_phone})
                          </span>
                        </div>

                        <div className="order-loc-info">
                          <span className="loc-text">
                            <span>{sub.orders?.shipping_address || "Shipping address on file"}</span>
                          </span>
                          <span className="order-date-text">{new Date(sub.created_at).toLocaleString()}</span>
                        </div>

                        <div className="order-amount-block">
                          <span className="amount-label">Vendor Payout:</span>
                          <span className="amount-val">{Number(sub.supplier_vendor_cost).toLocaleString()} EGP</span>
                        </div>

                        <div className="master-status-dropdown-col">
                          <label>Fulfillment Stage:</label>
                          <select
                            value={sub.status}
                            onChange={(e) => handleFulfillmentStatusChange(sub.id, e.target.value)}
                            className={`status-select ${sub.status}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="accepted_by_supplier">Accepted</option>
                            <option value="ready_for_pickup">Ready for Pickup</option>
                            <option value="picked_up">Picked Up</option>
                            <option value="out_for_delivery">Out for Delivery</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </div>
                      </div>

                      {/* Items to Pack */}
                      <div className="supplier-suborder-body">
                        <div className="packing-list-box">
                          <span className="packing-list-title">📦 Packing Slip & Line Items:</span>
                          {(sub.order_items || []).map((item) => (
                            <div key={item.id} className="sub-item-row">
                              <span><strong>{item.quantity}x</strong> {item.product_name_snapshot}</span>
                              <span>Unit Cost: {Number(item.unit_vendor_price).toLocaleString()} EGP</span>
                            </div>
                          ))}
                        </div>

                        <div className="courier-dispatch-row">
                          <div className="courier-field">
                            <label>Courier Service Name:</label>
                            <input
                              type="text"
                              defaultValue={sub.courier_name || "Bosta Express / Aramex"}
                              id={`courier-name-${sub.id}`}
                              className="mini-input"
                            />
                          </div>

                          <div className="courier-field">
                            <label>Tracking Number / Waybill:</label>
                            <input
                              type="text"
                              defaultValue={sub.courier_tracking_number || ""}
                              placeholder="e.g. TRK-892184"
                              id={`courier-trk-${sub.id}`}
                              className="mini-input"
                            />
                          </div>

                          <button
                            className="btn btn-primary btn-sm"
                            style={{ alignSelf: "flex-end" }}
                            onClick={() => {
                              const name = document.getElementById(`courier-name-${sub.id}`)?.value;
                              const trk = document.getElementById(`courier-trk-${sub.id}`)?.value;
                              handleCourierAssign(sub.id, name, trk);
                            }}
                          >
                            <Truck size={14} /> Dispatch Package
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────── TAB 2: MY PRODUCTS (SUPPLIER PRODUCT CRUD) ──────────────── */}
          {activeTab === "products" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>My Products Catalog</h3>
                  <p>Create, update, and manage your products and inventory in the store.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenProductModal()}>
                  <Plus size={16} /> Add New Product
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "product",
                    sortKey: "name_en",
                    label: "Product Name",
                    render: (row) => {
                      const img = row.product_imgs?.[0]?.img_link || "/Assets/Images/Laptop.png";
                      return (
                        <div className="product-table-cell">
                          <img src={img} alt={row.name_en} className="product-table-thumb" />
                          <div>
                            <strong>{row.name_en}</strong>
                            <div className="subtext">{row.name_ar} • ID #{row.id}</div>
                          </div>
                        </div>
                      );
                    },
                  },
                  {
                    key: "subcategory",
                    sortKey: "subcategories.name_en",
                    label: "Category",
                    render: (row) => (
                      <span>{row.subcategories?.name_en || "General"}</span>
                    ),
                  },
                  {
                    key: "condition",
                    sortKey: "condition",
                    label: "Condition",
                    render: (row) => (
                      <span className="condition-badge">{row.condition || "new"}</span>
                    ),
                  },
                    {
                    key: "price",
                    sortValue: (row) => Number(row.sale_price || 0),
                    label: "Sale Price",
                    render: (row) => (
                      <strong>{Number(row.sale_price || 0).toLocaleString()} EGP</strong>
                    ),
                  },
                  {
                    key: "vendor_price",
                    sortValue: (row) => Number(row.vendor_price || 0),
                    label: "Cost (EGP)",
                    render: (row) => (
                      <span>{Number(row.vendor_price || 0).toLocaleString()} EGP</span>
                    ),
                  },
                  {
                    key: "stock_quantity",
                    sortValue: (row) => Number(row.stock_quantity || 0),
                    label: "Stock",
                    render: (row) => (
                      <span className={Number(row.stock_quantity || 0) < 5 ? "stock-low" : "stock-ok"}>
                        {row.stock_quantity || 0} units
                      </span>
                    ),
                  },
                  {
                    key: "is_active",
                    sortKey: "is_active",
                    label: "Status",
                    render: (row) => (
                      <span style={{ color: row.is_active ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                        {row.is_active ? "Active" : "Inactive"}
                      </span>
                    ),
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    sortable: false,
                    render: (row) => (
                      <div className="table-actions-cell">
                        <button
                          className="action-icon-btn"
                          title="Edit Product"
                          onClick={() => handleOpenProductModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn danger"
                          title="Delete Product"
                          onClick={() => handleDeleteProduct(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={catalog}
                searchKeys={["name_en", "name_ar", "description_en", "subcategories.name_en"]}
                searchPlaceholder="Search your products..."
                isLoading={isLoadingCatalog}
                emptyMessage="You have not created any products yet. Click 'Add New Product' to get started."
              />
            </div>
          )}

          {/* ──────────────── TAB 3: INVENTORY & STOCK ──────────────── */}
          {activeTab === "inventory" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Supplier Inventory, Pricing & Costs</h3>
                  <p>Manage stock quantities and vendor costs directly in the live catalog database.</p>
                </div>
              </div>

              <DataTable
                columns={[
                  {
                    key: "product",
                    sortKey: "name_en",
                    label: "Product",
                    render: (row) => (
                      <div className="product-table-cell">
                        <img
                          src={row.product_imgs?.[0]?.img_link || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=400&q=80"}
                          alt={row.name_en}
                          className="product-table-thumb"
                        />
                        <div>
                          <strong>{row.name_en}</strong>
                          <div className="subtext">{row.name_ar} • ID #{row.id}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "vendor_price",
                    sortValue: (row) => Number(row.vendor_price || 0),
                    label: "Vendor Cost",
                    render: (row) => {
                      const isEditing = editingProductId === row.id;
                      return isEditing ? (
                        <input
                          type="number"
                          value={editCost}
                          onChange={(e) => setEditCost(e.target.value)}
                          className="mini-input"
                          style={{ width: "90px" }}
                        />
                      ) : (
                        <strong>{Number(row.vendor_price || 0).toLocaleString()} EGP</strong>
                      );
                    },
                  },
                  {
                    key: "sale_price",
                    sortValue: (row) => Number(row.sale_price || 0),
                    label: "Retail Price",
                    render: (row) => {
                      const isEditing = editingProductId === row.id;
                      return isEditing ? (
                        <input
                          type="number"
                          value={editSalePrice}
                          onChange={(e) => setEditSalePrice(e.target.value)}
                          className="mini-input"
                          style={{ width: "90px" }}
                        />
                      ) : (
                        <span>{Number(row.sale_price || 0).toLocaleString()} EGP</span>
                      );
                    },
                  },
                  {
                    key: "stock_quantity",
                    sortValue: (row) => Number(row.stock_quantity || 0),
                    label: "Current Stock",
                    render: (row) => {
                      const isEditing = editingProductId === row.id;
                      return isEditing ? (
                        <input
                          type="number"
                          value={editStock}
                          onChange={(e) => setEditStock(e.target.value)}
                          className="mini-input"
                          style={{ width: "80px" }}
                        />
                      ) : (
                        <span className={Number(row.stock_quantity || 0) < 5 ? "stock-low" : "stock-ok"}>
                          {row.stock_quantity || 0} units
                        </span>
                      );
                    },
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    sortable: false,
                    render: (row) => {
                      const isEditing = editingProductId === row.id;
                      return isEditing ? (
                        <div className="table-actions-cell">
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleSaveInventory(row.id)}
                          >
                            <Save size={14} /> Save
                          </button>
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => setEditingProductId(null)}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => {
                            setEditingProductId(row.id);
                            setEditStock(row.stock_quantity || 0);
                            setEditCost(row.vendor_price || 0);
                            setEditSalePrice(row.sale_price || 0);
                          }}
                        >
                          <Edit2 size={14} /> Edit Stock & Price
                        </button>
                      );
                    },
                  },
                ]}
                data={catalog}
                isLoading={isLoadingCatalog}
                emptyMessage="No products in catalog. Click 'Add New Product' in the Catalog tab to add items."
              />
            </div>
          )}

          {/* ──────────────── TAB 4: STOREWIDE SHIPPING POLICY ──────────────── */}
          {activeTab === "shipping" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Storewide Delivery Rate & SLA</h3>
                  <p>Configure the shipping fee and estimated delivery timeline used for all destinations.</p>
                </div>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => handleOpenShippingModal()}
                >
                  <Plus size={16} /> Configure Shipping
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "coverage",
                    label: "Coverage",
                    render: () => (
                      <div>
                        <strong>All destinations</strong>
                      </div>
                    ),
                  },
                  {
                    key: "shipping_cost",
                    label: "Shipping Fee",
                    render: (row) => <strong>{Number(row.shipping_cost).toLocaleString()} EGP</strong>,
                  },
                  {
                    key: "estimated_days",
                    label: "Estimated Delivery SLA",
                    render: (row) => (
                      <span>{row.estimated_days_min} – {row.estimated_days_max} business days</span>
                    ),
                  },
                  {
                    key: "is_active",
                    label: "Active Status",
                    render: (row) => <StatusBadge status={row.is_active} type="product" />,
                  },
                  {
                    key: "actions",
                    label: "Actions",
                    sortable: false,
                    render: (row) => (
                      <div className="table-actions-cell">
                        <button
                          className="action-icon-btn"
                          title="Edit Rate"
                          onClick={() => handleOpenShippingModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn danger"
                          title="Delete Rate"
                          onClick={() => handleDeleteShippingPolicy(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={shippingPolicies}
                isLoading={isLoadingShipping}
                emptyMessage="No custom shipping policies configured. Default platform rate applies."
              />
            </div>
          )}

          {/* ──────────────── TAB 5: RETURN & WARRANTY TERMS ──────────────── */}
          {activeTab === "policies" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Shipping, Return & Warranty Policy Configuration</h3>
                  <p>Set return and warranty terms shown to customers at checkout and on product detail pages.</p>
                </div>
              </div>

              <div className="dashboard-content-box">
                <form onSubmit={handleSavePolicy} className="admin-product-form">
                  <div className="form-grid-2">
                    <div className="form-group">
                      <label>Return Window (Days)*</label>
                      <input
                        type="number"
                        value={returnDays}
                        onChange={(e) => setReturnDays(e.target.value)}
                        min="7"
                        max="60"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Warranty Coverage (Months)*</label>
                      <input
                        type="number"
                        value={warrantyMonths}
                        onChange={(e) => setWarrantyMonths(e.target.value)}
                        min="0"
                        max="60"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Return & Exchange Conditions (English)</label>
                    <textarea
                      rows={3}
                      value={conditionsEn}
                      onChange={(e) => setConditionsEn(e.target.value)}
                      placeholder="e.g. Products must be in original condition with intact seals."
                    />
                  </div>

                  <div className="form-group">
                    <label>Return & Exchange Conditions (Arabic)</label>
                    <textarea
                      rows={3}
                      value={conditionsAr}
                      onChange={(e) => setConditionsAr(e.target.value)}
                      placeholder="مثال: يجب أن يكون المنتج بحالته الأصلية مع سلامة الصندوق وملحقاته."
                    />
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={isSavingPolicy}>
                    <Save size={16} /> {isSavingPolicy ? "Saving Policies..." : "Update Supplier Terms"}
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 6: FINANCIALS & PAYOUTS ──────────────── */}
          {activeTab === "financials" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Vendor Financial Statement & Payouts</h3>
                  <p>Track accrued vendor earnings, platform commission deductions, and payout statuses.</p>
                </div>
              </div>

              <div className="kpi-grid" style={{ marginBottom: "1.5rem" }}>
                <div className="kpi-card">
                  <div className="kpi-icon-wrapper revenue">
                    <DollarSign size={24} color="#059669" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Total Vendor Accrued</span>
                    <h4 className="kpi-value">{metrics?.totalVendorEarned?.toLocaleString() || "0"} EGP</h4>
                    <span className="kpi-subtext">All fulfilled sub-orders</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper orders">
                    <Clock size={24} color="var(--blue-bell)" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Pending / Eligible Payout</span>
                    <h4 className="kpi-value">{metrics?.pendingPayout?.toLocaleString() || "0"} EGP</h4>
                    <span className="kpi-subtext highlight">Processed weekly</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper suppliers">
                    <CheckCircle2 size={24} color="#10B981" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Paid to Bank Account</span>
                    <h4 className="kpi-value">{metrics?.paidPayout?.toLocaleString() || "0"} EGP</h4>
                    <span className="kpi-subtext positive">Settled payouts</span>
                  </div>
                </div>
              </div>

              {/* Transactions Statement Table */}
              <div className="dashboard-content-box">
                <h4>Sub-Orders Payout Breakdown Statement</h4>
                <div className="orders-table-wrapper" style={{ marginTop: "1rem" }}>
                  <table className="admin-orders-table">
                    <thead>
                      <tr>
                        <th>Sub-Order Code</th>
                        <th>Main Order</th>
                        <th>Vendor Cost</th>
                        <th>Courier Cash</th>
                        <th>Payout Approval</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subOrders.length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: "center", padding: "1.5rem" }}>
                            No sub-order statements found.
                          </td>
                        </tr>
                      ) : (
                        subOrders.map((sub) => (
                          <tr key={sub.id}>
                            <td><strong>{sub.sub_order_code}</strong></td>
                            <td>#{sub.orders?.order_code || sub.order_id}</td>
                            <td><strong>{Number(sub.supplier_vendor_cost).toLocaleString()} EGP</strong></td>
                            <td><StatusBadge status={sub.courier_cash_status || "pending"} type="cash" /></td>
                            <td><StatusBadge status={sub.supplier_payout_status || "pending"} type="payout" /></td>
                            <td>{new Date(sub.created_at).toLocaleDateString()}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ──────────────── MODAL: PRODUCT CREATE / EDIT ──────────────── */}
      <AnimatePresence>
        {isProductModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsProductModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingProduct ? `Edit Product: ${editingProduct.name_en}` : "Add New Supplier Product"}</h4>
                  <p>Product information, pricing, initial inventory and images</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsProductModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveProduct}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Product Name (English)*</label>
                        <input
                          type="text"
                          required
                          value={productForm.nameEn}
                          onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                          placeholder="e.g. Wireless Noise-Cancelling Headphones"
                        />
                      </div>
                      <div className="form-group">
                        <label>Product Name (Arabic)*</label>
                        <input
                          type="text"
                          required
                          value={productForm.nameAr}
                          onChange={(e) => setProductForm({ ...productForm, nameAr: e.target.value })}
                          placeholder="مثال: سماعات رأس لاسلكية عازلة للضوضاء"
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Category / Subcategory*</label>
                        <select
                          required
                          value={productForm.subcategoryId}
                          onChange={(e) => setProductForm({ ...productForm, subcategoryId: e.target.value })}
                        >
                          <option value="">Select Category</option>
                          {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.categories?.name_en || "Category"} → {sub.name_en} ({sub.name_ar})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Item Condition*</label>
                        <select
                          value={productForm.condition}
                          onChange={(e) => setProductForm({ ...productForm, condition: e.target.value })}
                        >
                          <option value="new">Brand New (جديد)</option>
                          <option value="refurbished">Refurbished (مجدد معتمد)</option>
                          <option value="open_box">Open Box (مفتوح العلبة)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Description (English)</label>
                        <textarea
                          rows={2}
                          value={productForm.descriptionEn}
                          onChange={(e) => setProductForm({ ...productForm, descriptionEn: e.target.value })}
                          placeholder="Detailed specifications and key features..."
                        />
                      </div>
                      <div className="form-group">
                        <label>Description (Arabic)</label>
                        <textarea
                          rows={2}
                          value={productForm.descriptionAr}
                          onChange={(e) => setProductForm({ ...productForm, descriptionAr: e.target.value })}
                          placeholder="المواصفات الفنية والميزات الرئيسية..."
                        />
                      </div>
                    </div>

                    {/* ─── PRICING & STOCK CONTROLS ─── */}
                    <div className="form-grid-3" style={{ marginTop: "1rem" }}>
                      <div className="form-group">
                        <label>Vendor Cost (EGP)*</label>
                        <input
                          type="number"
                          value={productForm.vendorPrice}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProductForm((prev) => ({
                              ...prev,
                              vendorPrice: val,
                              salePrice: prev.salePrice ? prev.salePrice : Math.round(Number(val) * 1.18),
                            }));
                          }}
                          placeholder="e.g. 38000"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Retail Sale Price (EGP)*</label>
                        <input
                          type="number"
                          value={productForm.salePrice}
                          onChange={(e) => setProductForm({ ...productForm, salePrice: e.target.value })}
                          placeholder="e.g. 45000"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Stock Quantity (Units)*</label>
                        <input
                          type="number"
                          value={productForm.stockQuantity}
                          onChange={(e) => setProductForm({ ...productForm, stockQuantity: e.target.value })}
                          placeholder="e.g. 15"
                          required
                        />
                      </div>
                    </div>

                    {/* ─── DIRECT WEBP IMAGE DROPZONE UPLOADER ─── */}
                    <div className="variant-builder-wrapper" style={{ marginTop: "1.25rem" }}>
                      <div className="variant-builder-header">
                        <h5>
                          <ImageIcon size={17} color="#059669" />
                          Product Media Gallery (Direct WebP Upload)
                        </h5>
                        <span className="dropzone-badge">
                          <CheckCircle2 size={13} /> Pure WebP Auto-Converter
                        </span>
                      </div>

                      {/* Dropzone File Selector */}
                      <label className="direct-image-dropzone">
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          style={{ display: "none" }}
                          disabled={isUploadingImages}
                          onChange={(e) => {
                            if (e.target.files && e.target.files.length > 0) {
                              handleUploadSupplierImageFiles(e.target.files);
                              e.target.value = "";
                            }
                          }}
                        />
                        <div className="dropzone-icon-circle">
                          {isUploadingImages ? (
                            <Loader2 size={24} className="animate-spin" />
                          ) : (
                            <UploadCloud size={24} />
                          )}
                        </div>
                        <p className="dropzone-title">
                          {isUploadingImages
                            ? "Converting & Uploading WebP to Supabase CDN..."
                            : "Drag & drop images here, or click to browse"}
                        </p>
                        <p className="dropzone-subtitle">
                          Supports PNG, JPG, JPEG, WEBP. Instant canvas compression and CDN upload.
                        </p>
                      </label>

                      {/* Uploaded Thumbnails Grid */}
                      {(productForm.images || []).length > 0 && (
                        <div className="uploaded-gallery-grid">
                          {productForm.images.map((img, idx) => (
                            <div
                              key={img.id || img.tempId || idx}
                              className={`gallery-preview-card ${img.isPrimary ? "primary" : ""}`}
                            >
                              <img
                                src={img.url || img.imgLink}
                                alt={`Product media ${idx + 1}`}
                                className="gallery-preview-thumb"
                              />
                              <div className="gallery-card-actions">
                                <button
                                  type="button"
                                  className={`primary-toggle-btn ${img.isPrimary ? "is-primary" : ""}`}
                                  onClick={() => {
                                    setProductForm((prev) => ({
                                      ...prev,
                                      images: prev.images.map((im, i) => ({
                                        ...im,
                                        isPrimary: i === idx,
                                      })),
                                    }));
                                  }}
                                >
                                  {img.isPrimary ? "★ Primary" : "Make Cover"}
                                </button>

                                <button
                                  type="button"
                                  className="action-icon-btn danger"
                                  title="Delete image"
                                  onClick={() => {
                                    setProductForm((prev) => {
                                      const next = prev.images.filter((_, i) => i !== idx);
                                      if (img.isPrimary && next.length > 0) {
                                        next[0].isPrimary = true;
                                      }
                                      return { ...prev, images: next };
                                    });
                                  }}
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={productForm.isActive}
                          onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                        />
                        <span>Active for Sale</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsProductModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isSavingProduct}>
                    {isSavingProduct ? <RefreshCw size={16} className="spin" /> : <Save size={16} />} Save Product
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: STOREWIDE SHIPPING POLICY ──────────────── */}
      <AnimatePresence>
        {isShippingModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsShippingModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingShippingPolicy ? "Edit Shipping Policy" : "Configure Shipping Policy"}</h4>
                  <p>Configure the storewide delivery fee and lead time</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsShippingModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveShippingPolicy}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-group">
                      <label>Shipping Cost (EGP)*</label>
                      <input
                        type="number"
                        min="0"
                        value={shippingForm.shippingCost}
                        onChange={(e) => setShippingForm({ ...shippingForm, shippingCost: Number(e.target.value) })}
                        required
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Min Estimated Days</label>
                        <input
                          type="number"
                          value={shippingForm.estimatedDaysMin}
                          onChange={(e) => setShippingForm({ ...shippingForm, estimatedDaysMin: Number(e.target.value) })}
                          min="1"
                        />
                      </div>
                      <div className="form-group">
                        <label>Max Estimated Days</label>
                        <input
                          type="number"
                          value={shippingForm.estimatedDaysMax}
                          onChange={(e) => setShippingForm({ ...shippingForm, estimatedDaysMax: Number(e.target.value) })}
                          min="1"
                        />
                      </div>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={shippingForm.isActive}
                          onChange={(e) => setShippingForm({ ...shippingForm, isActive: e.target.checked })}
                        />
                        <span>Active Rate</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsShippingModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Rate
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: SUPPLIER CHANGE OWN PASSWORD ──────────────── */}
      <AnimatePresence>
        {isPasswordModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsPasswordModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>Change Your Password</h4>
                  <p>Enter your current password and set a new secure password</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangePassword}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-group">
                      <label>Current Password*</label>
                      <input
                        type="password"
                        required
                        placeholder="Enter your current login password..."
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Password (min 6 characters)*</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Enter new password..."
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>

                    <div className="form-group">
                      <label>Confirm New Password*</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Confirm new password..."
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsPasswordModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isChangingPassword}>
                    {isChangingPassword ? <RefreshCw size={16} className="spin" /> : <Save size={16} />} Update Password
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── REUSABLE CONFIRM DIALOG ──────────────── */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        onConfirm={confirmDialog.onConfirm}
        onCancel={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}
