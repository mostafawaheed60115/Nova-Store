import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import {
  loginAdmin,
  getCurrentAdmin,
  logoutAdmin,
  fetchAdminMetrics,
  fetchMasterOrders,
  updateMasterOrderStatus,
  updateSubOrderFinances,
  fetchAdminProducts,
  createAdminProduct,
  updateAdminProduct,
  toggleProductActive,
  deleteAdminProduct,
  addProductImage,
  updateProductImage,
  deleteProductImage,
  fetchProductOffers,
  createProductOffer,
  updateProductOffer,
  deleteProductOffer,
  fetchCategoriesAdmin,
  createCategory,
  updateCategory,
  deleteCategory,
  fetchSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
  fetchAllSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  updateSupplierCommission,
  changeSupplierPassword,
  deleteMasterOrder,
  fetchAdminSupplierPolicies,
  createAdminShippingPolicy,
  updateAdminShippingPolicy,
  deleteAdminShippingPolicy,
  saveAdminReturnPolicy,
  fetchAdminCoupons,
  createAdminCoupon,
  updateAdminCoupon,
  deleteAdminCoupon,
  fetchCouponUsages,
  fetchAdminUsers,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  fetchTrustPropsAdmin,
  createTrustProp,
  updateTrustProp,
  deleteTrustProp,
  fetchHeroSlidesAdmin,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  fetchPromotionalAdsAdmin,
  createPromotionalAd,
  updatePromotionalAd,
  deletePromotionalAd,
  fetchAiConfigAdmin,
  updateAiConfigAdmin,
} from "../services/adminService";
import { convertToWebP, uploadImageToSupabase } from "../utils/imageConverter";
import DataTable from "./DataTable";
import StatusBadge from "./StatusBadge";
import ConfirmDialog from "./ConfirmDialog";
import {
  Lock,
  LayoutDashboard,
  ShoppingBag,
  Package,
  Users,
  UploadCloud,
  ArrowRight,
  RefreshCw,
  LogOut,
  ChevronRight,
  ChevronDown,
  DollarSign,
  CheckCircle2,
  Plus,
  Copy,
  Check,
  FileImage,
  Layers,
  ArrowLeft,
  Building,
  Ticket,
  Flame,
  ShieldCheck,
  Bot,
  Edit2,
  Trash2,
  Image as ImageIcon,
  SlidersHorizontal,
  Eye,
  Calendar,
  Percent,
  X,
  Save,
  Tag,
  Globe,
  ToggleLeft,
  ToggleRight,
  Key,
  Shield,
  FolderTree,
  Upload,
  Star,
  Loader2,
  Truck,
} from "lucide-react";

export default function AdminDashboard() {
  const [admin, setAdmin] = useState(getCurrentAdmin());
  const [username, setUsername] = useState("nova");
  const [password, setPassword] = useState("AnAelwelf17##");
  const [authError, setAuthError] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState("overview"); 
  // 'overview' | 'orders' | 'products' | 'categories' | 'suppliers' | 'offers' | 'coupons' | 'cms' | 'admins' | 'webp'
  const [cmsSubTab, setCmsSubTab] = useState("hero"); // 'hero' | 'ads' | 'trust' | 'ai'

  const { navigateTo, addToast, refreshStoreData } = useStore();
  const { isRtl } = useLanguage();

  // Live Data States
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [subcategories, setSubcategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [offersList, setOffersList] = useState([]);
  const [couponsList, setCouponsList] = useState([]);
  const [adminUsers, setAdminUsers] = useState([]);
  const [trustProps, setTrustProps] = useState([]);
  const [heroSlides, setHeroSlides] = useState([]);
  const [promotionalAds, setPromotionalAds] = useState([]);
  const [aiConfig, setAiConfig] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  // Loading States
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [isLoadingCategories, setIsLoadingCategories] = useState(false);
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(false);
  const [isLoadingCoupons, setIsLoadingCoupons] = useState(false);
  const [isLoadingOffers, setIsLoadingOffers] = useState(false);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);

  // Filter & Search States
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [expandedOrders, setExpandedOrders] = useState({});

  // Confirmation Modal
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: "",
    message: "",
    confirmLabel: "Confirm",
    variant: "danger",
    onConfirm: null,
  });

  // Modal State Controllers
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [prodForm, setProdForm] = useState({
    nameEn: "",
    nameAr: "",
    descriptionEn: "",
    descriptionAr: "",
    subcategoryId: 1,
    supplierId: 1,
    condition: "new",
    salePrice: "",
    vendorPrice: "",
    stockQuantity: 10,
    isBestSeller: false,
    isFeatured: false,
    isActive: true,
    images: [],
  });

  // Gallery Modal
  const [managingImagesProduct, setManagingImagesProduct] = useState(null);
  const [newImageUrl, setNewImageUrl] = useState("");
  const [newImageIsPrimary, setNewImageIsPrimary] = useState(false);

  // Category & Subcategory Modals
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [isUploadingCategoryImg, setIsUploadingCategoryImg] = useState(false);
  const [categoryForm, setCategoryForm] = useState({
    nameEn: "",
    nameAr: "",
    slug: "",
    imgLink: "",
    sortOrder: 0,
    isActive: true,
  });

  const [isSubcategoryModalOpen, setIsSubcategoryModalOpen] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [isUploadingSubcategoryImg, setIsUploadingSubcategoryImg] = useState(false);
  const [subcategoryForm, setSubcategoryForm] = useState({
    categoryId: 1,
    nameEn: "",
    nameAr: "",
    slug: "",
    imgLink: "",
    sortOrder: 0,
    isActive: true,
  });

  // Supplier Modal
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    commissionRate: 0.15,
    isActive: true,
  });

  // Supplier Password Change Modal (with Admin Password Verification)
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordSupplier, setPasswordSupplier] = useState(null);
  const [newSupplierPassword, setNewSupplierPassword] = useState("");
  const [adminVerificationPassword, setAdminVerificationPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Supplier Policies Modal (Shipping & Return Policies)
  const [isPoliciesModalOpen, setIsPoliciesModalOpen] = useState(false);
  const [policiesSupplier, setPoliciesSupplier] = useState(null);
  const [supplierShippingPolicies, setSupplierShippingPolicies] = useState([]);
  const [supplierReturnPolicy, setSupplierReturnPolicy] = useState(null);
  const [isPoliciesLoading, setIsPoliciesLoading] = useState(false);
  const [policyShippingCost, setPolicyShippingCost] = useState(50);
  const [policyMinDays, setPolicyMinDays] = useState(1);
  const [policyMaxDays, setPolicyMaxDays] = useState(3);
  const [editingPolicyId, setEditingPolicyId] = useState(null);
  const [returnDaysVal, setReturnDaysVal] = useState(14);
  const [warrantyMonthsVal, setWarrantyMonthsVal] = useState(12);

  // Offer Modal
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({
    productId: "",
    offerTitle: "",
    offerPercent: 15,
    priceAfterOffer: "",
    offerStart: "",
    offerEnd: "",
    isFeatured: true,
    isActive: true,
  });

  // Coupon Modal
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: "",
    discountType: "percentage",
    discountValue: 15,
    maxDiscountAmount: "",
    minOrderAmount: 0,
    targetScope: "entire_order",
    usageLimitTotal: "",
    usageLimitPerPhone: 1,
    startDate: "",
    expireDate: "",
    isActive: true,
    targetedIds: [],
  });
  const [viewingUsagesCoupon, setViewingUsagesCoupon] = useState(null);
  const [couponUsages, setCouponUsages] = useState([]);

  // Trust Proposition Modal
  const [isTrustModalOpen, setIsTrustModalOpen] = useState(false);
  const [editingTrustProp, setEditingTrustProp] = useState(null);
  const [trustForm, setTrustForm] = useState({
    titleEn: "",
    titleAr: "",
    descriptionEn: "",
    descriptionAr: "",
    icon: "ShieldCheck",
    linkUrl: "",
    sortOrder: 0,
    isActive: true,
  });

  // Admin User Modal
  const [isAdminUserModalOpen, setIsAdminUserModalOpen] = useState(false);
  const [editingAdminUser, setEditingAdminUser] = useState(null);
  const [adminUserForm, setAdminUserForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "admin",
    isActive: true,
  });

  // Hero & Ad Modals
  const [isHeroModalOpen, setIsHeroModalOpen] = useState(false);
  const [editingHeroSlide, setEditingHeroSlide] = useState(null);
  const [isUploadingHeroImage, setIsUploadingHeroImage] = useState(false);
  const [heroForm, setHeroForm] = useState({
    titleEn: "",
    titleAr: "",
    subtitleEn: "",
    subtitleAr: "",
    tagBadgeEn: "",
    tagBadgeAr: "",
    desktopImage: "",
    mobileImage: "",
    primaryCtaTextEn: "Shop Now",
    primaryCtaTextAr: "تسوق الآن",
    primaryCtaLink: "/catalog",
    secondaryCtaTextEn: "",
    secondaryCtaTextAr: "",
    secondaryCtaLink: "",
    sortOrder: 0,
    isActive: true,
  });

  const [isAdModalOpen, setIsAdModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState(null);
  const [adForm, setAdForm] = useState({
    titleEn: "",
    titleAr: "",
    subtitleEn: "",
    subtitleAr: "",
    badgeTextEn: "HOT OFFER",
    badgeTextAr: "عرض حصري",
    desktopImage: "",
    ctaTextEn: "Explore",
    ctaTextAr: "استكشف",
    ctaLink: "/catalog",
    sortOrder: 0,
    isActive: true,
  });

  // WebP Studio State
  const [webpFile, setWebpFile] = useState(null);
  const [convertedWebP, setConvertedWebP] = useState(null);
  const [isUploadingWebp, setIsUploadingWebp] = useState(false);
  const [uploadedWebpUrl, setUploadedWebpUrl] = useState("");
  const [uploadFolder, setUploadFolder] = useState("products");
  const [copiedWebpUrl, setCopiedWebpUrl] = useState(false);

  /* ──────────────── INITIAL DATA FETCHING ──────────────── */
  const loadAllAdminData = useCallback(async () => {
    if (!admin) return;
    try {
      const [
        metricsData,
        ordersData,
        productsData,
        catsData,
        subsData,
        suppsData,
        offersData,
        couponsData,
        adminsData,
        trustData,
        heroData,
        adsData,
        aiData,
      ] = await Promise.allSettled([
        fetchAdminMetrics(),
        fetchMasterOrders(),
        fetchAdminProducts(),
        fetchCategoriesAdmin(),
        fetchSubcategories(),
        fetchAllSuppliers(),
        fetchProductOffers(),
        fetchAdminCoupons(),
        fetchAdminUsers(),
        fetchTrustPropsAdmin(),
        fetchHeroSlidesAdmin(),
        fetchPromotionalAdsAdmin(),
        fetchAiConfigAdmin(),
      ]);

      if (metricsData.status === "fulfilled") setMetrics(metricsData.value);
      if (ordersData.status === "fulfilled") setOrders(ordersData.value);
      if (productsData.status === "fulfilled") setProductsList(productsData.value);
      if (catsData.status === "fulfilled") setCategoriesList(catsData.value);
      if (subsData.status === "fulfilled") setSubcategories(subsData.value);
      if (suppsData.status === "fulfilled") setSuppliers(suppsData.value);
      if (offersData.status === "fulfilled") setOffersList(offersData.value);
      if (couponsData.status === "fulfilled") setCouponsList(couponsData.value);
      if (adminsData.status === "fulfilled") setAdminUsers(adminsData.value);
      if (trustData.status === "fulfilled") setTrustProps(trustData.value);
      if (heroData.status === "fulfilled") setHeroSlides(heroData.value);
      if (adsData.status === "fulfilled") setPromotionalAds(adsData.value);
      if (aiData.status === "fulfilled") setAiConfig(aiData.value);
    } catch (err) {
      addToast(`Error refreshing data: ${err.message}`, "error");
    }
  }, [admin, addToast]);

  useEffect(() => {
    if (admin) {
      loadAllAdminData();
    }
  }, [admin, loadAllAdminData]);

  /* ──────────────── AUTHENTICATION ──────────────── */
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError("");
    setIsLoggingIn(true);
    try {
      const user = await loginAdmin(username, password);
      setAdmin(user);
      addToast(`Welcome back, ${user.username}!`, "success");
    } catch (err) {
      setAuthError(err.message || "Failed to authenticate.");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    logoutAdmin();
    setAdmin(null);
    navigateTo("home");
  };

  /* ──────────────── PRODUCT CRUD & ACTIONS ──────────────── */
  const handleUploadImageFiles = async (files, isDirectToProduct = false, targetProductId = null) => {
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

      if (isDirectToProduct && targetProductId) {
        for (const item of uploadedList) {
          await addProductImage(targetProductId, {
            imgLink: item.url,
            isPrimary: false,
          });
        }
        const updated = await fetchAdminProducts();
        setProductsList(updated);
        if (managingImagesProduct && managingImagesProduct.id === targetProductId) {
          setManagingImagesProduct(updated.find((p) => p.id === targetProductId));
        }
        addToast(`Uploaded and attached ${uploadedList.length} WebP image(s) to gallery!`, "success");
      } else {
        setProdForm((prev) => {
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
      }
    } catch (err) {
      console.error("Upload error:", err);
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleOpenProductModal = (product = null) => {
    if (product) {
      setEditingProduct(product);
      setProdForm({
        nameEn: product.name_en || "",
        nameAr: product.name_ar || "",
        descriptionEn: product.description_en || "",
        descriptionAr: product.description_ar || "",
        subcategoryId: product.subcategory_id || subcategories[0]?.id || 1,
        supplierId: product.supplier_id || suppliers[0]?.id || 1,
        condition: product.condition || "new",
        salePrice: product.sale_price !== undefined ? product.sale_price : "",
        vendorPrice: product.vendor_price !== undefined ? product.vendor_price : "",
        stockQuantity: product.stock_quantity !== undefined ? product.stock_quantity : 10,
        isBestSeller: Boolean(product.is_best_seller),
        isFeatured: Boolean(product.is_featured),
        isActive: product.is_active !== false,
        images: (product.product_imgs || []).map((img) => ({
          id: img.id,
          url: img.img_link,
          isPrimary: Boolean(img.is_primary),
        })),
      });
    } else {
      setEditingProduct(null);
      setProdForm({
        nameEn: "",
        nameAr: "",
        descriptionEn: "",
        descriptionAr: "",
        subcategoryId: subcategories[0]?.id || 1,
        supplierId: suppliers[0]?.id || 1,
        condition: "new",
        salePrice: "",
        vendorPrice: "",
        stockQuantity: 10,
        isBestSeller: false,
        isFeatured: false,
        isActive: true,
        images: [],
      });
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!prodForm.salePrice || Number(prodForm.salePrice) <= 0) {
      addToast("Please specify a valid retail sale price in EGP.", "error");
      return;
    }

    try {
      if (editingProduct) {
        await updateAdminProduct(editingProduct.id, prodForm);
        addToast(`Product #${editingProduct.id} updated!`, "success");
      } else {
        await createAdminProduct(prodForm);
        addToast("New product created with pricing & media!", "success");
      }
      setIsProductModalOpen(false);
      const updated = await fetchAdminProducts();
      setProductsList(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save product: ${err.message}`, "error");
    }
  };

  // Distinct: Soft Deactivate/Activate Toggle
  const handleToggleProductStatus = async (product) => {
    const nextStatus = !product.is_active;
    try {
      await toggleProductActive(product.id, nextStatus);
      addToast(`Product #${product.id} is now ${nextStatus ? "Active" : "Deactivated"}`, "success");
      const updated = await fetchAdminProducts();
      setProductsList(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to change status: ${err.message}`, "error");
    }
  };

  // Distinct: Hard Permanent Deletion
  const handleDeleteProduct = (product) => {
    setConfirmDialog({
      isOpen: true,
      title: `Permanently Delete "${product.name_en}"?`,
      message: "Warning: This action is permanent and cannot be undone. It will remove the product, gallery images, and active deals.",
      confirmLabel: "Delete Permanently",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAdminProduct(product.id);
          addToast(`Product #${product.id} permanently deleted`, "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchAdminProducts();
          setProductsList(updated);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete product: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── CATEGORY & SUBCATEGORY CRUD ──────────────── */
  const handleOpenCategoryModal = (cat = null) => {
    if (cat) {
      setEditingCategory(cat);
      setCategoryForm({
        nameEn: cat.name_en,
        nameAr: cat.name_ar,
        slug: cat.slug,
        imgLink: cat.img_link || "",
        sortOrder: cat.sort_order || 0,
        isActive: cat.is_active !== false,
      });
    } else {
      setEditingCategory(null);
      setCategoryForm({
        nameEn: "",
        nameAr: "",
        slug: "",
        imgLink: "",
        sortOrder: categoriesList.length + 1,
        isActive: true,
      });
    }
    setIsCategoryModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, categoryForm);
        addToast("Category updated!", "success");
      } else {
        await createCategory(categoryForm);
        addToast("New category created!", "success");
      }
      setIsCategoryModalOpen(false);
      const updated = await fetchCategoriesAdmin();
      setCategoriesList(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save category: ${err.message}`, "error");
    }
  };

  const handleDeleteCategory = (cat) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Category "${cat.name_en}"?`,
      message: "Warning: This will delete this category and all its nested subcategories.",
      confirmLabel: "Delete Category",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteCategory(cat.id);
          addToast("Category deleted", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchCategoriesAdmin();
          setCategoriesList(updated);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete category: ${err.message}`, "error");
        }
      },
    });
  };

  const handleOpenSubcategoryModal = (sub = null, defaultCatId = null) => {
    if (sub) {
      setEditingSubcategory(sub);
      setSubcategoryForm({
        categoryId: sub.category_id,
        nameEn: sub.name_en,
        nameAr: sub.name_ar,
        slug: sub.slug,
        imgLink: sub.img_link || "",
        sortOrder: sub.sort_order || 0,
        isActive: sub.is_active !== false,
      });
    } else {
      setEditingSubcategory(null);
      setSubcategoryForm({
        categoryId: defaultCatId || categoriesList[0]?.id || 1,
        nameEn: "",
        nameAr: "",
        slug: "",
        imgLink: "",
        sortOrder: 0,
        isActive: true,
      });
    }
    setIsSubcategoryModalOpen(true);
  };

  const handleSaveSubcategory = async (e) => {
    e.preventDefault();
    try {
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory.id, subcategoryForm);
        addToast("Subcategory updated!", "success");
      } else {
        await createSubcategory(subcategoryForm);
        addToast("New subcategory created!", "success");
      }
      setIsSubcategoryModalOpen(false);
      const updatedCats = await fetchCategoriesAdmin();
      const updatedSubs = await fetchSubcategories();
      setCategoriesList(updatedCats);
      setSubcategories(updatedSubs);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save subcategory: ${err.message}`, "error");
    }
  };

  const handleDeleteSubcategory = (sub) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Subcategory "${sub.name_en}"?`,
      message: "Are you sure you want to delete this subcategory?",
      confirmLabel: "Delete Subcategory",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteSubcategory(sub.id);
          addToast("Subcategory deleted", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updatedCats = await fetchCategoriesAdmin();
          const updatedSubs = await fetchSubcategories();
          setCategoriesList(updatedCats);
          setSubcategories(updatedSubs);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete subcategory: ${err.message}`, "error");
        }
      },
    });
  };

  const handleUploadCategoryImg = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file.", "warning");
      return;
    }
    setIsUploadingCategoryImg(true);
    try {
      const publicUrl = await uploadImageToSupabase(file, "categories", "store-media");
      setCategoryForm((prev) => ({ ...prev, imgLink: publicUrl }));
      addToast("Category banner image converted to WebP and uploaded!", "success");
    } catch (err) {
      console.error("Category upload error:", err);
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingCategoryImg(false);
    }
  };

  const handleUploadSubcategoryImg = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file.", "warning");
      return;
    }
    setIsUploadingSubcategoryImg(true);
    try {
      const publicUrl = await uploadImageToSupabase(file, "subcategories", "store-media");
      setSubcategoryForm((prev) => ({ ...prev, imgLink: publicUrl }));
      addToast("Subcategory image converted to WebP and uploaded!", "success");
    } catch (err) {
      console.error("Subcategory upload error:", err);
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingSubcategoryImg(false);
    }
  };

  /* ──────────────── SUPPLIER CRUD ──────────────── */
  const handleOpenSupplierModal = (supp = null) => {
    if (supp) {
      setEditingSupplier(supp);
      setSupplierForm({
        name: supp.name || "",
        phone: supp.phone || "",
        email: supp.email || "",
        password: "",
        commissionRate: supp.commission_rate !== undefined ? supp.commission_rate : 0.15,
        isActive: supp.is_active !== false,
      });
    } else {
      setEditingSupplier(null);
      setSupplierForm({
        name: "",
        phone: "",
        email: "",
        password: "SupplierPass123#",
        commissionRate: 0.15,
        isActive: true,
      });
    }
    setIsSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    try {
      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, supplierForm);
        addToast("Supplier profile updated!", "success");
      } else {
        await createSupplier(supplierForm);
        addToast("New supplier registered successfully!", "success");
      }
      setIsSupplierModalOpen(false);
      const updated = await fetchAllSuppliers();
      setSuppliers(updated);
    } catch (err) {
      addToast(`Failed to save supplier: ${err.message}`, "error");
    }
  };

  const handleDeleteSupplier = (supp) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Supplier "${supp.name}"?`,
      message: "Warning: This will remove this supplier account and their associated shipping policies.",
      confirmLabel: "Delete Supplier",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteSupplier(supp.id);
          addToast("Supplier removed", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchAllSuppliers();
          setSuppliers(updated);
        } catch (err) {
          addToast(`Failed to delete supplier: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── COUPON CRUD & TARGETED ITEMS ──────────────── */
  const handleOpenCouponModal = (coupon = null) => {
    if (coupon) {
      setEditingCoupon(coupon);
      const targetedIds = (coupon.coupon_targeted_items || []).map((t) => Number(t.target_id));
      setCouponForm({
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: coupon.discount_value,
        maxDiscountAmount: coupon.max_discount_amount || "",
        minOrderAmount: coupon.min_order_amount || 0,
        targetScope: coupon.target_scope || "entire_order",
        usageLimitTotal: coupon.usage_limit_total || "",
        usageLimitPerPhone: coupon.usage_limit_per_phone || 1,
        startDate: coupon.start_date ? coupon.start_date.slice(0, 10) : "",
        expireDate: coupon.expire_date ? coupon.expire_date.slice(0, 10) : "",
        isActive: coupon.is_active !== false,
        targetedIds,
      });
    } else {
      setEditingCoupon(null);
      setCouponForm({
        code: "NOVA15",
        discountType: "percentage",
        discountValue: 15,
        maxDiscountAmount: 300,
        minOrderAmount: 500,
        targetScope: "entire_order",
        usageLimitTotal: 200,
        usageLimitPerPhone: 1,
        startDate: new Date().toISOString().slice(0, 10),
        expireDate: new Date(Date.now() + 45 * 86400000).toISOString().slice(0, 10),
        isActive: true,
        targetedIds: [],
      });
    }
    setIsCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      if (editingCoupon) {
        await updateAdminCoupon(editingCoupon.id, couponForm);
        addToast(`Coupon "${couponForm.code}" updated!`, "success");
      } else {
        await createAdminCoupon(couponForm);
        addToast(`Coupon "${couponForm.code}" published!`, "success");
      }
      setIsCouponModalOpen(false);
      const updated = await fetchAdminCoupons();
      setCouponsList(updated);
    } catch (err) {
      addToast(`Failed to save coupon: ${err.message}`, "error");
    }
  };

  const handleDeleteCoupon = (coupon) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Coupon "${coupon.code}"?`,
      message: "This will remove the coupon code and targeted scope rules.",
      confirmLabel: "Delete Coupon",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAdminCoupon(coupon.id);
          addToast(`Coupon "${coupon.code}" deleted`, "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchAdminCoupons();
          setCouponsList(updated);
        } catch (err) {
          addToast(`Failed to delete coupon: ${err.message}`, "error");
        }
      },
    });
  };

  const handleViewCouponUsages = async (coupon) => {
    setViewingUsagesCoupon(coupon);
    try {
      const usages = await fetchCouponUsages(coupon.id);
      setCouponUsages(usages);
    } catch (err) {
      addToast(`Failed to load usage history: ${err.message}`, "error");
    }
  };

  /* ──────────────── OFFERS CRUD ──────────────── */
  const handleOpenOfferModal = (offer = null) => {
    if (offer) {
      setEditingOffer(offer);
      setOfferForm({
        productId: offer.product_id,
        offerTitle: offer.offer_title || "",
        offerPercent: offer.offer_percent || 15,
        priceAfterOffer: offer.price_after_offer || "",
        offerStart: offer.offer_start ? offer.offer_start.slice(0, 10) : "",
        offerEnd: offer.offer_end ? offer.offer_end.slice(0, 10) : "",
        isFeatured: Boolean(offer.is_featured),
        isActive: offer.is_active !== false,
      });
    } else {
      setEditingOffer(null);
      const firstProd = productsList[0];
      const basePrice = Number(firstProd?.sale_price || 1000);
      setOfferForm({
        productId: firstProd?.id || "",
        offerTitle: "Seasonal Super Saver",
        offerPercent: 15,
        priceAfterOffer: Math.round(basePrice * 0.85),
        offerStart: new Date().toISOString().slice(0, 10),
        offerEnd: new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10),
        isFeatured: true,
        isActive: true,
      });
    }
    setIsOfferModalOpen(true);
  };

  const handleSaveOffer = async (e) => {
    e.preventDefault();
    try {
      if (editingOffer) {
        await updateProductOffer(editingOffer.id, offerForm);
        addToast("Offer updated successfully!", "success");
      } else {
        await createProductOffer(offerForm);
        addToast("New promotional offer created!", "success");
      }
      setIsOfferModalOpen(false);
      const updated = await fetchProductOffers();
      setOffersList(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save offer: ${err.message}`, "error");
    }
  };

  const handleDeleteOffer = (offer) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Promotional Deal?",
      message: `Are you sure you want to remove "${offer.offer_title}"?`,
      confirmLabel: "Delete Offer",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteProductOffer(offer.id);
          addToast("Offer removed", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchProductOffers();
          setOffersList(updated);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete offer: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── SUPPLIER PASSWORD MANAGEMENT (WITH ADMIN VERIFICATION) ──────────────── */
  const handleOpenPasswordModal = (supp) => {
    setPasswordSupplier(supp);
    setNewSupplierPassword("");
    setAdminVerificationPassword("");
    setIsPasswordModalOpen(true);
  };

  const handleChangeSupplierPassword = async (e) => {
    e.preventDefault();
    if (!passwordSupplier) return;
    if (!newSupplierPassword || newSupplierPassword.length < 6) {
      addToast("New supplier password must be at least 6 characters.", "warning");
      return;
    }
    if (!adminVerificationPassword) {
      addToast("Please enter your admin password to verify this action.", "warning");
      return;
    }

    setIsChangingPassword(true);
    try {
      await changeSupplierPassword({
        adminId: admin.id,
        adminPassword: adminVerificationPassword,
        supplierId: passwordSupplier.id,
        newPassword: newSupplierPassword,
      });
      addToast(`Password for supplier "${passwordSupplier.name}" updated successfully!`, "success");
      setIsPasswordModalOpen(false);
    } catch (err) {
      addToast(`Password change failed: ${err.message}`, "error");
    } finally {
      setIsChangingPassword(false);
    }
  };

  /* ──────────────── SUPPLIER POLICIES (SHIPPING & RETURNS) ──────────────── */
  const handleOpenPoliciesModal = async (supp) => {
    setPoliciesSupplier(supp);
    setIsPoliciesLoading(true);
    setIsPoliciesModalOpen(true);
    setEditingPolicyId(null);
    setPolicyShippingCost(50);
    setPolicyMinDays(1);
    setPolicyMaxDays(3);

    try {
      const pol = await fetchAdminSupplierPolicies(supp.id);
      setSupplierShippingPolicies(pol.shippingPolicies || []);
      setSupplierReturnPolicy(pol.returnPolicy || null);
      if (pol.returnPolicy) {
        setReturnDaysVal(pol.returnPolicy.return_days || 14);
        setWarrantyMonthsVal(pol.returnPolicy.warranty_months || 12);
      }
    } catch (err) {
      addToast(`Failed to load supplier policies: ${err.message}`, "error");
    } finally {
      setIsPoliciesLoading(false);
    }
  };

  const handleSaveShippingRate = async (e) => {
    e.preventDefault();
    if (!policiesSupplier) return;
    try {
      if (editingPolicyId) {
        await updateAdminShippingPolicy(editingPolicyId, {
          shippingCost: policyShippingCost,
          estimatedDaysMin: policyMinDays,
          estimatedDaysMax: policyMaxDays,
          isActive: true,
        });
        addToast("Shipping rate updated!", "success");
      } else {
        await createAdminShippingPolicy(policiesSupplier.id, {
          shippingCost: policyShippingCost,
          estimatedDaysMin: policyMinDays,
          estimatedDaysMax: policyMaxDays,
          isActive: true,
        });
        addToast("New shipping rate added!", "success");
      }
      setEditingPolicyId(null);
      setPolicyShippingCost(50);
      const pol = await fetchAdminSupplierPolicies(policiesSupplier.id);
      setSupplierShippingPolicies(pol.shippingPolicies || []);
    } catch (err) {
      addToast(`Failed to save shipping rate: ${err.message}`, "error");
    }
  };

  const handleDeleteShippingRate = async (policyId) => {
    try {
      await deleteAdminShippingPolicy(policyId);
      addToast("Shipping rate removed", "success");
      const pol = await fetchAdminSupplierPolicies(policiesSupplier.id);
      setSupplierShippingPolicies(pol.shippingPolicies || []);
    } catch (err) {
      addToast(`Failed to delete shipping rate: ${err.message}`, "error");
    }
  };

  const handleSaveReturnSettings = async (e) => {
    e.preventDefault();
    if (!policiesSupplier) return;
    try {
      await saveAdminReturnPolicy(policiesSupplier.id, {
        return_allowed: true,
        return_days: Number(returnDaysVal),
        exchange_allowed: true,
        exchange_days: Number(returnDaysVal),
        warranty_months: Number(warrantyMonthsVal),
      });
      addToast("Return & warranty policy saved!", "success");
      const pol = await fetchAdminSupplierPolicies(policiesSupplier.id);
      setSupplierReturnPolicy(pol.returnPolicy);
    } catch (err) {
      addToast(`Failed to save return policy: ${err.message}`, "error");
    }
  };

  /* ──────────────── MASTER ORDER DELETION ──────────────── */
  const handleDeleteOrder = (order) => {
    setConfirmDialog({
      isOpen: true,
      title: `Delete Order ${order.order_code}?`,
      message: "Warning: This permanently removes this order and its items from database records.",
      confirmLabel: "Delete Order",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteMasterOrder(order.id);
          addToast(`Order ${order.order_code} deleted successfully`, "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchMasterOrders();
          setOrders(updated);
        } catch (err) {
          addToast(`Failed to delete order: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── ADMIN USER ACCOUNTS ──────────────── */
  const handleOpenAdminUserModal = (user = null) => {
    if (user) {
      setEditingAdminUser(user);
      setAdminUserForm({
        username: user.username,
        email: user.email,
        password: "",
        role: user.role || "admin",
        isActive: user.is_active !== false,
      });
    } else {
      setEditingAdminUser(null);
      setAdminUserForm({
        username: "",
        email: "",
        password: "AdminSecurePassword123#",
        role: "admin",
        isActive: true,
      });
    }
    setIsAdminUserModalOpen(true);
  };

  const handleSaveAdminUser = async (e) => {
    e.preventDefault();
    try {
      if (editingAdminUser) {
        await updateAdminUser(editingAdminUser.id, adminUserForm);
        addToast("Admin user updated!", "success");
      } else {
        await createAdminUser(adminUserForm);
        addToast("New admin account created!", "success");
      }
      setIsAdminUserModalOpen(false);
      const updated = await fetchAdminUsers();
      setAdminUsers(updated);
    } catch (err) {
      addToast(`Failed to save admin user: ${err.message}`, "error");
    }
  };

  const handleDeleteAdminUser = (user) => {
    if (user.username === "nova") {
      addToast("Cannot delete the root administrator user (nova).", "warning");
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: `Delete Admin Account "${user.username}"?`,
      message: "This admin will permanently lose access to the operations console.",
      confirmLabel: "Delete Account",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteAdminUser(user.id);
          addToast("Admin user deleted", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchAdminUsers();
          setAdminUsers(updated);
        } catch (err) {
          addToast(`Failed to delete admin user: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── TRUST PROPOSITIONS CRUD ──────────────── */
  const handleOpenTrustModal = (prop = null) => {
    if (prop) {
      setEditingTrustProp(prop);
      setTrustForm({
        titleEn: prop.title_en,
        titleAr: prop.title_ar,
        descriptionEn: prop.description_en,
        descriptionAr: prop.description_ar,
        icon: prop.icon || "ShieldCheck",
        linkUrl: prop.link_url || "",
        sortOrder: prop.sort_order || 0,
        isActive: prop.is_active !== false,
      });
    } else {
      setEditingTrustProp(null);
      setTrustForm({
        titleEn: "",
        titleAr: "",
        descriptionEn: "",
        descriptionAr: "",
        icon: "ShieldCheck",
        linkUrl: "",
        sortOrder: trustProps.length + 1,
        isActive: true,
      });
    }
    setIsTrustModalOpen(true);
  };

  const handleSaveTrustProp = async (e) => {
    e.preventDefault();
    try {
      if (editingTrustProp) {
        await updateTrustProp(editingTrustProp.id, trustForm);
        addToast("Trust proposition updated!", "success");
      } else {
        await createTrustProp(trustForm);
        addToast("New trust proposition added!", "success");
      }
      setIsTrustModalOpen(false);
      const updated = await fetchTrustPropsAdmin();
      setTrustProps(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save trust proposition: ${err.message}`, "error");
    }
  };

  const handleDeleteTrustProp = (prop) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Trust Proposition?",
      message: `Are you sure you want to remove "${prop.title_en}"?`,
      confirmLabel: "Delete",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteTrustProp(prop.id);
          addToast("Trust proposition removed", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchTrustPropsAdmin();
          setTrustProps(updated);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete trust prop: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── HERO & AD SLIDES CRUD ──────────────── */
  const handleOpenHeroModal = (slide = null) => {
    if (slide) {
      setEditingHeroSlide(slide);
      setHeroForm({
        titleEn: slide.title_en,
        titleAr: slide.title_ar,
        subtitleEn: slide.subtitle_en || "",
        subtitleAr: slide.subtitle_ar || "",
        tagBadgeEn: slide.tag_badge_en || "",
        tagBadgeAr: slide.tag_badge_ar || "",
        desktopImage: slide.desktop_image,
        mobileImage: slide.mobile_image || "",
        primaryCtaTextEn: slide.primary_cta_text_en || "Shop Now",
        primaryCtaTextAr: slide.primary_cta_text_ar || "تسوق الآن",
        primaryCtaLink: slide.primary_cta_link || "/catalog",
        secondaryCtaTextEn: slide.secondary_cta_text_en || "",
        secondaryCtaTextAr: slide.secondary_cta_text_ar || "",
        secondaryCtaLink: slide.secondary_cta_link || "",
        sortOrder: slide.sort_order || 0,
        isActive: slide.is_active !== false,
      });
    } else {
      setEditingHeroSlide(null);
      setHeroForm({
        titleEn: "",
        titleAr: "",
        subtitleEn: "",
        subtitleAr: "",
        tagBadgeEn: "FLAGSHIP LAUNCH",
        tagBadgeAr: "إطلاق مميز",
        desktopImage: "",
        mobileImage: "",
        primaryCtaTextEn: "Shop Now",
        primaryCtaTextAr: "تسوق الآن",
        primaryCtaLink: "/catalog",
        secondaryCtaTextEn: "",
        secondaryCtaTextAr: "",
        secondaryCtaLink: "",
        sortOrder: heroSlides.length + 1,
        isActive: true,
      });
    }
    setIsHeroModalOpen(true);
  };

  const handleSaveHeroSlide = async (e) => {
    e.preventDefault();
    try {
      if (editingHeroSlide) {
        await updateHeroSlide(editingHeroSlide.id, heroForm);
        addToast("Hero banner updated!", "success");
      } else {
        await createHeroSlide(heroForm);
        addToast("New hero banner published!", "success");
      }
      setIsHeroModalOpen(false);
      const updated = await fetchHeroSlidesAdmin();
      setHeroSlides(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save hero slide: ${err.message}`, "error");
    }
  };

  const handleUploadHeroImage = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const file = fileList[0];
    if (!file.type.startsWith("image/")) {
      addToast("Please select a valid image file.", "warning");
      return;
    }
    setIsUploadingHeroImage(true);
    try {
      const publicUrl = await uploadImageToSupabase(file, "hero", "store-media");
      setHeroForm((prev) => ({ ...prev, desktopImage: publicUrl }));
      addToast("Hero banner image converted to WebP and uploaded!", "success");
    } catch (err) {
      console.error("Hero upload error:", err);
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingHeroImage(false);
    }
  };

  const handleDeleteHeroSlide = (slide) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Hero Banner?",
      message: `Delete banner "${slide.title_en}"?`,
      confirmLabel: "Delete Banner",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deleteHeroSlide(slide.id);
          addToast("Hero banner deleted", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchHeroSlidesAdmin();
          setHeroSlides(updated);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete banner: ${err.message}`, "error");
        }
      },
    });
  };

  const handleOpenAdModal = (ad = null) => {
    if (ad) {
      setEditingAd(ad);
      setAdForm({
        titleEn: ad.title_en,
        titleAr: ad.title_ar,
        subtitleEn: ad.subtitle_en || "",
        subtitleAr: ad.subtitle_ar || "",
        badgeTextEn: ad.badge_text_en || "HOT OFFER",
        badgeTextAr: ad.badge_text_ar || "عرض حصري",
        desktopImage: ad.desktop_image || "",
        ctaTextEn: ad.cta_text_en || "Explore",
        ctaTextAr: ad.cta_text_ar || "استكشف",
        ctaLink: ad.cta_link || "/catalog",
        sortOrder: ad.sort_order || 0,
        isActive: ad.is_active !== false,
      });
    } else {
      setEditingAd(null);
      setAdForm({
        titleEn: "",
        titleAr: "",
        subtitleEn: "",
        subtitleAr: "",
        badgeTextEn: "LIMITED TIME",
        badgeTextAr: "لفترة محدودة",
        desktopImage: "",
        ctaTextEn: "Shop Deals",
        ctaTextAr: "تسوق العروض",
        ctaLink: "/catalog",
        sortOrder: promotionalAds.length + 1,
        isActive: true,
      });
    }
    setIsAdModalOpen(true);
  };

  const handleSaveAd = async (e) => {
    e.preventDefault();
    try {
      if (editingAd) {
        await updatePromotionalAd(editingAd.id, adForm);
        addToast("Promo ticker updated!", "success");
      } else {
        await createPromotionalAd(adForm);
        addToast("Promo ticker ad added!", "success");
      }
      setIsAdModalOpen(false);
      const updated = await fetchPromotionalAdsAdmin();
      setPromotionalAds(updated);
      refreshStoreData();
    } catch (err) {
      addToast(`Failed to save ad: ${err.message}`, "error");
    }
  };

  const handleDeleteAd = (ad) => {
    setConfirmDialog({
      isOpen: true,
      title: "Delete Promo Ad?",
      message: `Delete ad "${ad.title_en}"?`,
      confirmLabel: "Delete Ad",
      variant: "danger",
      onConfirm: async () => {
        try {
          await deletePromotionalAd(ad.id);
          addToast("Promo ad deleted", "success");
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          const updated = await fetchPromotionalAdsAdmin();
          setPromotionalAds(updated);
          refreshStoreData();
        } catch (err) {
          addToast(`Failed to delete ad: ${err.message}`, "error");
        }
      },
    });
  };

  /* ──────────────── AI ASSISTANT CONFIG ──────────────── */
  const handleSaveAiConfig = async (e) => {
    e.preventDefault();
    if (!aiConfig) return;
    try {
      await updateAiConfigAdmin(aiConfig.id, aiConfig);
      addToast("AI Assistant configurations updated!", "success");
    } catch (err) {
      addToast(`Failed to save AI config: ${err.message}`, "error");
    }
  };

  /* ──────────────── WEBP CONVERTER ──────────────── */
  const handleWebpFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setWebpFile(file);
    setUploadedWebpUrl("");
    setConvertedWebP(null);
    try {
      const res = await convertToWebP(file, { quality: 0.88 });
      setConvertedWebP(res);
      addToast("Image converted to WebP format!", "success");
    } catch (err) {
      addToast(`Conversion failed: ${err.message}`, "error");
    }
  };

  const handleUploadWebP = async () => {
    if (!webpFile) return;
    setIsUploadingWebp(true);
    try {
      const result = await uploadImageToSupabase(webpFile, uploadFolder);
      setUploadedWebpUrl(result.url);
      addToast(`Uploaded to CDN! (-${result.compressionRatio}% size reduction)`, "success");
    } catch (err) {
      addToast(`Upload failed: ${err.message}`, "error");
    } finally {
      setIsUploadingWebp(false);
    }
  };

  const handleCopyWebpLink = () => {
    if (!uploadedWebpUrl) return;
    navigator.clipboard?.writeText(uploadedWebpUrl);
    setCopiedWebpUrl(true);
    addToast("CDN Link copied to clipboard!", "success");
    setTimeout(() => setCopiedWebpUrl(false), 2500);
  };

  /* ──────────────── FILTERED ORDERS ──────────────── */
  const filteredOrders = useMemo(() => {
    if (orderStatusFilter === "all") return orders;
    return orders.filter((o) => o.order_status === orderStatusFilter);
  }, [orders, orderStatusFilter]);

  /* ──────────────── RENDER LOGIN SCREEN ──────────────── */
  if (!admin) {
    return (
      <div className="dashboard-login-screen">
        <div className="dashboard-login-card">
          <img
            src="/Assets/no bg logo.png"
            alt="Nova Store"
            style={{ width: 68, height: 68, objectFit: "contain", margin: "0 auto 1.25rem", display: "block" }}
          />
          <div className="login-badge-pill admin">
            <Lock size={14} /> Master Operations Console
          </div>
          <h2>Nova Store Admin Portal</h2>
          <p>Secure administrative access for catalog, inventory, order routing, and partner finances.</p>

          {authError && <div className="auth-error-banner">{authError}</div>}

          <form onSubmit={handleLogin} className="admin-product-form">
            <div className="form-group">
              <label>Administrator Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Username"
                required
              />
            </div>

            <div className="form-group">
              <label>Security Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoggingIn}>
              {isLoggingIn ? "Authenticating..." : "Access Operations Console"} <ArrowRight size={16} />
            </button>

            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginTop: "0.5rem" }}
              onClick={() => {
                setUsername("nova");
                setPassword("AnAelwelf17##");
              }}
            >
              Fill Verified Admin Credentials
            </button>
          </form>

          <div className="login-footer-actions">
            <button className="return-store-link" onClick={() => navigateTo("home")}>
              <ArrowLeft size={14} /> Return to Storefront
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────── MAIN DASHBOARD APPLICATION ──────────────── */
  return (
    <div className="dashboard-app-wrapper" dir={isRtl ? "rtl" : "ltr"}>
      {/* Top Navbar */}
      <header className="dashboard-topbar">
        <div className="topbar-left">
          <button className="topbar-store-btn" onClick={() => navigateTo("home")}>
            <ArrowLeft size={16} /> Live Storefront
          </button>
          <div className="topbar-divider" />
          <div className="topbar-title-block" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <img
              src="/Assets/no bg logo.png"
              alt="Nova Store"
              style={{ width: 34, height: 34, objectFit: "contain" }}
            />
            <div>
              <span className="topbar-badge admin">Master Operations</span>
              <h2>Nova Store Central Command</h2>
            </div>
          </div>
        </div>

        <div className="topbar-right">
          <div className="topbar-user-badge">
            <span className="user-avatar-dot admin" />
            <span>{admin.username} ({admin.role || "Super Admin"})</span>
          </div>

          <button className="topbar-icon-btn" onClick={loadAllAdminData} title="Sync Live Database">
            <RefreshCw size={16} />
          </button>

          <button className="topbar-logout-btn" onClick={handleLogout} title="Sign Out">
            <LogOut size={16} /> Logout
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="dashboard-body-layout">
        {/* Sidebar Nav */}
        <aside className="dashboard-sidebar">
          <nav className="dashboard-nav-list">
            <button
              className={`dashboard-nav-item ${activeTab === "overview" ? "active" : ""}`}
              onClick={() => setActiveTab("overview")}
            >
              <LayoutDashboard size={18} />
              <span>Overview & KPIs</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "orders" ? "active" : ""}`}
              onClick={() => setActiveTab("orders")}
            >
              <ShoppingBag size={18} />
              <span>Master Orders</span>
              {metrics?.pendingOrders > 0 && (
                <span className="nav-counter-pill">{metrics.pendingOrders}</span>
              )}
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "products" ? "active" : ""}`}
              onClick={() => setActiveTab("products")}
            >
              <Package size={18} />
              <span>Product Catalog</span>
              <span className="nav-counter-pill" style={{ background: "#3B82F6" }}>
                {productsList.length}
              </span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "categories" ? "active" : ""}`}
              onClick={() => setActiveTab("categories")}
            >
              <FolderTree size={18} />
              <span>Categories & Subcats</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "suppliers" ? "active" : ""}`}
              onClick={() => setActiveTab("suppliers")}
            >
              <Building size={18} />
              <span>Suppliers & Vendors</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "offers" ? "active" : ""}`}
              onClick={() => setActiveTab("offers")}
            >
              <Flame size={18} />
              <span>Promotional Deals</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "coupons" ? "active" : ""}`}
              onClick={() => setActiveTab("coupons")}
            >
              <Ticket size={18} />
              <span>Coupons & Scopes</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "cms" ? "active" : ""}`}
              onClick={() => setActiveTab("cms")}
            >
              <Layers size={18} />
              <span>CMS & Banners</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "admins" ? "active" : ""}`}
              onClick={() => setActiveTab("admins")}
            >
              <Shield size={18} />
              <span>Admin Accounts</span>
            </button>

            <button
              className={`dashboard-nav-item ${activeTab === "webp" ? "active" : ""}`}
              onClick={() => setActiveTab("webp")}
            >
              <UploadCloud size={18} />
              <span>WebP Media Studio</span>
            </button>
          </nav>
        </aside>

        {/* Content Pane */}
        <main className="dashboard-main-content">
          {/* ──────────────── TAB 1: OVERVIEW ──────────────── */}
          {activeTab === "overview" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Operations Overview</h3>
                  <p>Real-time analytics, revenue breakdowns, and quick action shortcuts.</p>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="kpi-grid">
                <div className="kpi-card">
                  <div className="kpi-icon-wrapper revenue">
                    <DollarSign size={24} color="#059669" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Store Revenue</span>
                    <h4 className="kpi-value">{metrics?.totalRevenue?.toLocaleString() || "0"} EGP</h4>
                    <span className="kpi-subtext positive">Fulfilled store revenue</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper orders">
                    <ShoppingBag size={24} color="var(--blue-bell)" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Master Orders</span>
                    <h4 className="kpi-value">{metrics?.totalOrders || "0"}</h4>
                    <span className="kpi-subtext highlight">{metrics?.pendingOrders || "0"} action required</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper products">
                    <Package size={24} color="var(--light-coral)" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Active Catalog</span>
                    <h4 className="kpi-value">{metrics?.totalProducts || "0"}</h4>
                    <span className="kpi-subtext">{productsList.length} catalog items</span>
                  </div>
                </div>

                <div className="kpi-card">
                  <div className="kpi-icon-wrapper suppliers">
                    <Building size={24} color="#7C3AED" />
                  </div>
                  <div className="kpi-info">
                    <span className="kpi-label">Suppliers & Hubs</span>
                    <h4 className="kpi-value">{metrics?.totalSuppliers || "0"}</h4>
                    <span className="kpi-subtext">{suppliers.length} active vendors</span>
                  </div>
                </div>
              </div>

              {/* Quick Launchers */}
              <div className="dashboard-content-box" style={{ marginTop: "1.5rem" }}>
                <div className="box-header-row">
                  <h4>Quick Console Launchers</h4>
                </div>
                <div className="quick-actions-grid">
                  <button className="quick-action-card" onClick={() => handleOpenProductModal()}>
                    <Plus size={20} color="var(--blue-bell)" />
                    <div>
                      <strong>Add New Product</strong>
                      <p>Publish item with variants & WebP CDN images</p>
                    </div>
                  </button>

                  <button className="quick-action-card" onClick={() => handleOpenCouponModal()}>
                    <Ticket size={20} color="#E11D48" />
                    <div>
                      <strong>Issue Discount Code</strong>
                      <p>Create percentage or fixed discount with target scope</p>
                    </div>
                  </button>

                  <button className="quick-action-card" onClick={() => handleOpenCategoryModal()}>
                    <FolderTree size={20} color="#059669" />
                    <div>
                      <strong>New Category</strong>
                      <p>Create department with bilingual labels & media</p>
                    </div>
                  </button>

                  <button className="quick-action-card" onClick={() => handleOpenSupplierModal()}>
                    <Building size={20} color="#7C3AED" />
                    <div>
                      <strong>Register Supplier</strong>
                      <p>Create fulfillment vendor account</p>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ──────────────── TAB 2: MASTER ORDERS ──────────────── */}
          {activeTab === "orders" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Master Order Dispatch & Fulfillment</h3>
                  <p>Track customer orders, sub-order routing by supplier, and cash-on-delivery settlements.</p>
                </div>
                <div className="filter-pill-group">
                  {["all", "pending", "confirmed", "processing", "shipped", "delivered", "cancelled"].map((st) => (
                    <button
                      key={st}
                      className={`filter-pill-btn ${orderStatusFilter === st ? "active" : ""}`}
                      onClick={() => setOrderStatusFilter(st)}
                    >
                      {st.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              {filteredOrders.length === 0 ? (
                <div className="dashboard-content-box" style={{ textAlign: "center", padding: "3rem" }}>
                  <ShoppingBag size={48} color="#94A3B8" style={{ margin: "0 auto 1rem" }} />
                  <h4>No orders found matching "{orderStatusFilter}"</h4>
                  <p>Customer orders submitted from the storefront checkout will appear here.</p>
                </div>
              ) : (
                <div className="master-orders-list">
                  {filteredOrders.map((order) => {
                    const isExpanded = Boolean(expandedOrders[order.id]);
                    return (
                      <div key={order.id} className="master-order-card">
                        <div
                          className="master-order-header"
                          onClick={() => setExpandedOrders((prev) => ({ ...prev, [order.id]: !isExpanded }))}
                        >
                          <div className="order-main-info">
                            <button className="expand-toggle-btn">
                              {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>
                            <div>
                              <span className="order-code-text">{order.order_code}</span>
                              <span className="order-customer-text">
                                {order.customer_name} • {order.customer_phone}
                              </span>
                            </div>
                          </div>

                          <div className="order-loc-info">
                            <span className="order-date-text">{new Date(order.created_at).toLocaleString()}</span>
                          </div>

                          <div className="order-amount-block">
                            <span className="amount-label">Grand Total:</span>
                            <span className="amount-val">{Number(order.final_price).toLocaleString()} EGP</span>
                          </div>

                          <div className="master-status-dropdown-col" onClick={(e) => e.stopPropagation()} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <div style={{ flex: 1 }}>
                              <label>Master Order Status:</label>
                              <select
                                value={order.order_status}
                                onChange={async (e) => {
                                  try {
                                    await updateMasterOrderStatus(order.id, e.target.value);
                                    addToast(`Order ${order.order_code} set to ${e.target.value}`, "success");
                                    const updated = await fetchMasterOrders();
                                    setOrders(updated);
                                  } catch (err) {
                                    addToast(err.message, "error");
                                  }
                                }}
                                className={`status-select ${order.order_status}`}
                              >
                                <option value="pending">Pending</option>
                                <option value="confirmed">Confirmed</option>
                                <option value="processing">Processing</option>
                                <option value="shipped">Shipped</option>
                                <option value="delivered">Delivered</option>
                                <option value="cancelled">Cancelled</option>
                              </select>
                            </div>
                            <button
                              className="action-icon-btn danger"
                              title="Delete Order"
                              style={{ marginTop: "1rem" }}
                              onClick={() => handleDeleteOrder(order)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>

                        {/* Accordion Content */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              className="master-order-details-drawer"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                            >
                              <div className="customer-shipping-summary">
                                <strong>Delivery Address:</strong> {order.shipping_address}
                                {order.notes && <span> | <strong>Notes:</strong> {order.notes}</span>}
                              </div>

                              <div className="sub-orders-title">Assigned Supplier Sub-Orders:</div>
                              <div className="sub-orders-grid">
                                {(order.sub_orders || []).map((sub) => (
                                  <div key={sub.id} className="sub-order-box">
                                    <div className="sub-box-header">
                                      <div>
                                        <span className="sub-code">{sub.sub_order_code}</span>
                                        <span className="sub-supplier-name">Vendor: {sub.suppliers?.name || "Official Distributor"}</span>
                                      </div>
                                      <span className={`status-pill ${sub.status}`}>{sub.status}</span>
                                    </div>

                                    {/* Line Items */}
                                    <div className="sub-items-list">
                                      {(sub.order_items || []).map((item) => (
                                        <div key={item.id} className="sub-item-row">
                                          <span><strong>{item.quantity}x</strong> {item.product_name_snapshot} ({item.variant_name_snapshot})</span>
                                          <span>{Number(item.total_price).toLocaleString()} EGP</span>
                                        </div>
                                      ))}
                                    </div>

                                    {/* Finance Controls */}
                                    <div className="sub-financial-controls">
                                      <div className="finance-control-group">
                                        <label>Courier Cash:</label>
                                        <select
                                          value={sub.courier_cash_status || "pending"}
                                          onChange={(e) =>
                                            updateSubOrderFinances(sub.id, { courierCashStatus: e.target.value })
                                          }
                                          className="mini-select"
                                        >
                                          <option value="pending">Pending Collection</option>
                                          <option value="collected">Collected by Courier</option>
                                          <option value="settled">Settled in Bank</option>
                                        </select>
                                      </div>

                                      <div className="finance-control-group">
                                        <label>Supplier Payout:</label>
                                        <select
                                          value={sub.supplier_payout_status || "pending"}
                                          onChange={(e) =>
                                            updateSubOrderFinances(sub.id, { supplierPayoutStatus: e.target.value })
                                          }
                                          className="mini-select"
                                        >
                                          <option value="pending">Pending</option>
                                          <option value="eligible">Eligible for Payout</option>
                                          <option value="paid">Paid to Supplier</option>
                                        </select>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ──────────────── TAB 3: PRODUCT CATALOG (NO SKU, DEACTIVATE VS DELETE) ──────────────── */}
          {activeTab === "products" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Live Product Catalog</h3>
                  <p>Add, edit, toggle active status, manage variants and photo galleries.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenProductModal()}>
                  <Plus size={16} /> Add New Product
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "name_en",
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
                          <div className="subtext">{row.name_ar}</div>
                        </div>
                      </div>
                    ),
                  },
                  {
                    key: "subcategory",
                    sortKey: "subcategories.name_en",
                    label: "Subcategory",
                    render: (row) => (
                      <span className="category-tag">
                        {row.subcategories?.name_en || "General"}
                      </span>
                    ),
                  },
                  {
                    key: "supplier",
                    sortKey: "suppliers.name",
                    label: "Supplier",
                    render: (row) => <span>{row.suppliers?.name || "Nova Official"}</span>,
                  },
                  {
                    key: "price",
                    sortValue: (row) => Number(row.sale_price || 0),
                    label: "Sale Price",
                    render: (row) => <strong>{Number(row.sale_price || 0).toLocaleString()} EGP</strong>,
                  },
                  {
                    key: "vendor_price",
                    sortValue: (row) => Number(row.vendor_price || 0),
                    label: "Vendor Cost",
                    render: (row) => <span>{Number(row.vendor_price || 0).toLocaleString()} EGP</span>,
                  },
                  {
                    key: "stock",
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
                    label: "Store Status",
                    render: (row) => (
                      <button
                        className={`status-toggle-btn ${row.is_active ? "active" : "inactive"}`}
                        onClick={() => handleToggleProductStatus(row)}
                        title={row.is_active ? "Click to Deactivate from Store" : "Click to Activate on Store"}
                      >
                        {row.is_active ? <ToggleRight size={22} color="#10B981" /> : <ToggleLeft size={22} color="#94A3B8" />}
                        <span>{row.is_active ? "Active" : "Deactivated"}</span>
                      </button>
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
                          title="Edit Details"
                          onClick={() => handleOpenProductModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Manage Gallery"
                          onClick={() => setManagingImagesProduct(row)}
                        >
                          <ImageIcon size={16} />
                        </button>
                        <button
                          className="action-icon-btn danger"
                          title="Permanently Delete Product"
                          onClick={() => handleDeleteProduct(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={productsList}
                searchKeys={["name_en", "name_ar", "description_en", "subcategories.name_en", "suppliers.name"]}
                searchPlaceholder="Search products by title or description..."
                isLoading={isLoadingProducts}
                emptyMessage="No products in catalog. Click 'Add New Product' to create one."
              />
            </div>
          )}

          {/* ──────────────── TAB 4: CATEGORIES & SUBCATEGORIES CRUD ──────────────── */}
          {activeTab === "categories" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Categories & Subcategories Hierarchy</h3>
                  <p>Organize product departments, subcategories, sort order, and department photos.</p>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button className="btn btn-outline btn-sm" onClick={() => handleOpenSubcategoryModal()}>
                    <Plus size={16} /> Add Subcategory
                  </button>
                  <button className="btn btn-primary btn-sm" onClick={() => handleOpenCategoryModal()}>
                    <Plus size={16} /> Add Main Category
                  </button>
                </div>
              </div>

              {categoriesList.length === 0 ? (
                <div className="dashboard-content-box" style={{ textAlign: "center", padding: "3rem" }}>
                  <FolderTree size={48} color="#94A3B8" style={{ margin: "0 auto 1rem" }} />
                  <h4>No categories configured yet</h4>
                  <p>Create your main store departments like Laptops, Phones, Audio, etc.</p>
                </div>
              ) : (
                <div className="categories-tree-list">
                  {categoriesList.map((cat) => (
                    <div key={cat.id} className="category-admin-card">
                      <div className="category-card-top">
                        <div className="category-info-meta">
                          <img
                            src={cat.img_link || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=150&q=80"}
                            alt={cat.name_en}
                            className="cat-thumb-preview"
                          />
                          <div>
                            <strong style={{ fontSize: "1.05rem", color: "var(--prussian-blue)" }}>
                              {cat.name_en} — {cat.name_ar}
                            </strong>
                            <div className="subtext">
                              Slug: <code>{cat.slug}</code> | Sort: #{cat.sort_order || 0} | Status:{" "}
                              <span style={{ color: cat.is_active ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                                {cat.is_active ? "Active" : "Inactive"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="table-actions-cell">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleOpenSubcategoryModal(null, cat.id)}
                            title="Add Subcategory under this department"
                          >
                            <Plus size={14} /> Add Subcategory
                          </button>
                          <button
                            className="action-icon-btn"
                            onClick={() => handleOpenCategoryModal(cat)}
                            title="Edit Category"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            className="action-icon-btn danger"
                            onClick={() => handleDeleteCategory(cat)}
                            title="Delete Category"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      {/* Subcategories Table */}
                      <table className="subcategories-table">
                        <tbody>
                          {(cat.subcategories || []).length === 0 ? (
                            <tr>
                              <td colSpan={4} style={{ color: "var(--steel-blue)", fontStyle: "italic", padding: "0.85rem 1.25rem" }}>
                                No nested subcategories. Click 'Add Subcategory' to attach one.
                              </td>
                            </tr>
                          ) : (
                            (cat.subcategories || []).map((sub) => (
                              <tr key={sub.id}>
                                <td style={{ width: "35%" }}>
                                  <strong>{sub.name_en}</strong>
                                  <div className="subtext">{sub.name_ar}</div>
                                </td>
                                <td><code>{sub.slug}</code></td>
                                <td>
                                  <span style={{ color: sub.is_active ? "#10B981" : "#EF4444", fontSize: "0.75rem", fontWeight: 700 }}>
                                    {sub.is_active ? "Active" : "Inactive"}
                                  </span>
                                </td>
                                <td style={{ textAlign: "right" }}>
                                  <div className="table-actions-cell" style={{ justifyContent: "flex-end" }}>
                                    <button
                                      className="action-icon-btn"
                                      onClick={() => handleOpenSubcategoryModal(sub)}
                                      title="Edit Subcategory"
                                    >
                                      <Edit2 size={14} />
                                    </button>
                                    <button
                                      className="action-icon-btn danger"
                                      onClick={() => handleDeleteSubcategory(sub)}
                                      title="Delete Subcategory"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ──────────────── TAB 5: SUPPLIERS CRUD ──────────────── */}
          {activeTab === "suppliers" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Suppliers & Vendors Management</h3>
                  <p>Manage merchant partner accounts, contact details, and commission rates.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenSupplierModal()}>
                  <Plus size={16} /> Register New Supplier
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "name",
                    label: "Supplier / Business Name",
                    render: (row) => (
                      <div>
                        <strong>{row.name}</strong>
                        <div className="subtext">ID #{row.id} • {row.email || "No email"}</div>
                      </div>
                    ),
                  },
                  {
                    key: "phone",
                    label: "Contact Phone",
                    render: (row) => <span>{row.phone}</span>,
                  },
                  {
                    key: "commission",
                    sortValue: (row) => Number(row.commission_rate) || 0.15,
                    label: "Commission Rate",
                    render: (row) => (
                      <span className="commission-badge">
                        {Math.round((Number(row.commission_rate) || 0.15) * 100)}% Platform Fee
                      </span>
                    ),
                  },
                  {
                    key: "is_active",
                    sortKey: "is_active",
                    label: "Status",
                    render: (row) => (
                      <span style={{ color: row.is_active ? "#10B981" : "#EF4444", fontWeight: 700, fontSize: "0.8rem" }}>
                        {row.is_active ? "Active Partner" : "Suspended"}
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
                          title="Change Supplier Password (Admin Verified)"
                          onClick={() => handleOpenPasswordModal(row)}
                        >
                          <Key size={16} color="#F59E0B" />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Shipping & Return Policies"
                          onClick={() => handleOpenPoliciesModal(row)}
                        >
                          <Truck size={16} color="#3B82F6" />
                        </button>
                        <button
                          className="action-icon-btn"
                          title="Edit Profile"
                          onClick={() => handleOpenSupplierModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn danger"
                          title="Delete Supplier"
                          onClick={() => handleDeleteSupplier(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={suppliers}
                searchKeys={["name", "phone", "email"]}
                searchPlaceholder="Search suppliers by name, phone, email..."
                isLoading={isLoadingSuppliers}
                emptyMessage="No suppliers registered yet."
              />
            </div>
          )}

          {/* ──────────────── TAB 6: PROMOTIONAL DEALS & OFFERS ──────────────── */}
          {activeTab === "offers" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Promotional Deals & Time-Limited Offers</h3>
                  <p>Schedule deals with percentage discounts on specific products in EGP.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenOfferModal()}>
                  <Plus size={16} /> Create New Deal
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "offer_title",
                    label: "Offer Headline",
                    render: (row) => (
                      <div>
                        <strong>{row.offer_title}</strong>
                        <div className="subtext">{row.products?.name_en || "Catalog Product"}</div>
                      </div>
                    ),
                  },
                  {
                    key: "discount",
                    sortValue: (row) => Number(row.offer_percent || 0),
                    label: "Discount",
                    render: (row) => (
                      <span className="discount-pill">-{row.offer_percent}% OFF</span>
                    ),
                  },
                  {
                    key: "price_after_offer",
                    sortValue: (row) => Number(row.price_after_offer || 0),
                    label: "Deal Price",
                    render: (row) => (
                      <strong>{Number(row.price_after_offer).toLocaleString()} EGP</strong>
                    ),
                  },
                  {
                    key: "dates",
                    sortValue: (row) => new Date(row.offer_start || 0).getTime(),
                    label: "Campaign Duration",
                    render: (row) => (
                      <div className="subtext">
                        {new Date(row.offer_start).toLocaleDateString()} &rarr;{" "}
                        {new Date(row.offer_end).toLocaleDateString()}
                      </div>
                    ),
                  },
                  {
                    key: "is_active",
                    sortKey: "is_active",
                    label: "Active",
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
                          title="Edit Offer"
                          onClick={() => handleOpenOfferModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn danger"
                          title="Delete Offer"
                          onClick={() => handleDeleteOffer(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={offersList}
                searchKeys={["offer_title", "products.name_en"]}
                isLoading={isLoadingOffers}
                emptyMessage="No promotional deals created yet."
              />
            </div>
          )}

          {/* ──────────────── TAB 7: COUPONS & SCOPES CRUD ──────────────── */}
          {activeTab === "coupons" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Discount Coupons & Targeted Scopes</h3>
                  <p>Issue promo codes with target scopes (Entire Order, Specific Categories, Specific Products) in EGP.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenCouponModal()}>
                  <Plus size={16} /> Issue New Coupon
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "code",
                    sortKey: "code",
                    label: "Coupon Code",
                    render: (row) => <code className="coupon-code-pill">{row.code}</code>,
                  },
                  {
                    key: "discount",
                    sortValue: (row) => Number(row.discount_value || 0),
                    label: "Discount Value",
                    render: (row) => (
                      <strong>
                        {row.discount_type === "percentage"
                          ? `${row.discount_value}% Discount`
                          : `${Number(row.discount_value).toLocaleString()} EGP Fixed`}
                      </strong>
                    ),
                  },
                  {
                    key: "scope",
                    sortKey: "target_scope",
                    label: "Target Scope",
                    render: (row) => (
                      <span className="category-tag">
                        {row.target_scope === "entire_order"
                          ? "Entire Order"
                          : row.target_scope === "specific_categories"
                          ? `Categories (${row.coupon_targeted_items?.length || 0})`
                          : `Products (${row.coupon_targeted_items?.length || 0})`}
                      </span>
                    ),
                  },
                  {
                    key: "limits",
                    sortValue: (row) => Number(row.min_order_amount || 0),
                    label: "Min Order / Cap",
                    render: (row) => (
                      <div className="subtext">
                        Min: {row.min_order_amount ? `${Number(row.min_order_amount).toLocaleString()} EGP` : "None"} |{" "}
                        Cap: {row.max_discount_amount ? `${Number(row.max_discount_amount).toLocaleString()} EGP` : "None"}
                      </div>
                    ),
                  },
                  {
                    key: "used_count",
                    sortValue: (row) => Number(row.used_count || 0),
                    label: "Redemptions",
                    render: (row) => (
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                        onClick={() => handleViewCouponUsages(row)}
                      >
                        <Eye size={12} /> {row.used_count || 0} Uses
                      </button>
                    ),
                  },
                  {
                    key: "expires",
                    label: "Expires On",
                    render: (row) => (
                      <span className="subtext">{new Date(row.expire_date).toLocaleDateString()}</span>
                    ),
                  },
                  {
                    key: "is_active",
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
                          title="Edit Coupon"
                          onClick={() => handleOpenCouponModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-icon-btn danger"
                          title="Delete Coupon"
                          onClick={() => handleDeleteCoupon(row)}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={couponsList}
                isLoading={isLoadingCoupons}
                emptyMessage="No coupons issued yet."
              />
            </div>
          )}

          {/* ──────────────── TAB 8: CMS & BANNERS ──────────────── */}
          {activeTab === "cms" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>CMS Media & Marketing Assets</h3>
                  <p>Manage Homepage Hero Banners, Vertical Promo Ticker Ads, Trust Pillars, and AI prompts.</p>
                </div>
                <div className="cms-subtab-bar">
                  <button
                    className={`cms-subtab-btn ${cmsSubTab === "hero" ? "active" : ""}`}
                    onClick={() => setCmsSubTab("hero")}
                  >
                    Hero Carousel ({heroSlides.length})
                  </button>
                  <button
                    className={`cms-subtab-btn ${cmsSubTab === "ads" ? "active" : ""}`}
                    onClick={() => setCmsSubTab("ads")}
                  >
                    Vertical Ticker Ads ({promotionalAds.length})
                  </button>
                  <button
                    className={`cms-subtab-btn ${cmsSubTab === "trust" ? "active" : ""}`}
                    onClick={() => setCmsSubTab("trust")}
                  >
                    Trust Pillars ({trustProps.length})
                  </button>
                  <button
                    className={`cms-subtab-btn ${cmsSubTab === "ai" ? "active" : ""}`}
                    onClick={() => setCmsSubTab("ai")}
                  >
                    AI Config
                  </button>
                </div>
              </div>

              {/* Sub-tab 1: Hero Carousel */}
              {cmsSubTab === "hero" && (
                <div className="dashboard-content-box">
                  <div className="box-header-row">
                    <h4>Hero Banners</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenHeroModal()}>
                      <Plus size={16} /> Add Hero Slide
                    </button>
                  </div>

                  <div className="cms-cards-grid">
                    {heroSlides.map((slide) => (
                      <div key={slide.id} className="cms-slide-card">
                        <img src={slide.desktop_image} alt={slide.title_en} className="cms-slide-img" />
                        <div className="cms-slide-body">
                          <span className="category-tag">{slide.tag_badge_en || "BANNER"}</span>
                          <h5>{slide.title_en}</h5>
                          <p>{slide.subtitle_en}</p>
                          <div className="modal-footer" style={{ padding: "0.75rem 0 0", marginTop: "0.75rem" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenHeroModal(slide)}>
                              <Edit2 size={14} /> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteHeroSlide(slide)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 2: Promo Ticker Ads */}
              {cmsSubTab === "ads" && (
                <div className="dashboard-content-box">
                  <div className="box-header-row">
                    <h4>Vertical Promo Ticker Segment Ads</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenAdModal()}>
                      <Plus size={16} /> Add Ticker Ad
                    </button>
                  </div>

                  <div className="cms-cards-grid">
                    {promotionalAds.map((ad) => (
                      <div key={ad.id} className="cms-slide-card">
                        <div className="cms-slide-body">
                          <span className="category-tag">{ad.badge_text_en || "OFFER"}</span>
                          <h5>{ad.title_en}</h5>
                          <p>{ad.subtitle_en}</p>
                          <div className="modal-footer" style={{ padding: "0.75rem 0 0", marginTop: "0.75rem" }}>
                            <button className="btn btn-outline btn-sm" onClick={() => handleOpenAdModal(ad)}>
                              <Edit2 size={14} /> Edit
                            </button>
                            <button className="btn btn-danger btn-sm" onClick={() => handleDeleteAd(ad)}>
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Trust Pillars */}
              {cmsSubTab === "trust" && (
                <div className="dashboard-content-box">
                  <div className="box-header-row">
                    <h4>Trust Value Propositions</h4>
                    <button className="btn btn-primary btn-sm" onClick={() => handleOpenTrustModal()}>
                      <Plus size={16} /> Add Trust Pillar
                    </button>
                  </div>

                  <div className="trust-admin-grid">
                    {trustProps.map((prop) => (
                      <div key={prop.id} className="trust-admin-card">
                        <div className="trust-card-header">
                          <ShieldCheck size={24} color="var(--blue-bell)" />
                          <strong>{prop.title_en}</strong>
                        </div>
                        <div className="subtext">{prop.title_ar}</div>
                        <p>{prop.description_en}</p>
                        <div className="modal-footer" style={{ padding: "0.75rem 0 0", marginTop: "0.75rem" }}>
                          <button className="action-icon-btn" onClick={() => handleOpenTrustModal(prop)}>
                            <Edit2 size={14} />
                          </button>
                          <button className="action-icon-btn danger" onClick={() => handleDeleteTrustProp(prop)}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 4: AI Config */}
              {cmsSubTab === "ai" && aiConfig && (
                <div className="dashboard-content-box">
                  <h4>AI Hardware Assistant Configuration</h4>
                  <form onSubmit={handleSaveAiConfig} className="admin-product-form" style={{ marginTop: "1rem" }}>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Assistant Display Name (EN)</label>
                        <input
                          type="text"
                          value={aiConfig.assistant_name_en || ""}
                          onChange={(e) => setAiConfig({ ...aiConfig, assistant_name_en: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Assistant Display Name (AR)</label>
                        <input
                          type="text"
                          value={aiConfig.assistant_name_ar || ""}
                          onChange={(e) => setAiConfig({ ...aiConfig, assistant_name_ar: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>System Recommendation Prompt</label>
                      <textarea
                        rows={5}
                        value={aiConfig.system_prompt || ""}
                        onChange={(e) => setAiConfig({ ...aiConfig, system_prompt: e.target.value })}
                      />
                    </div>

                    <button type="submit" className="btn btn-primary">
                      <Save size={16} /> Save AI Configuration
                    </button>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* ──────────────── TAB 10: ADMIN USER ACCOUNTS ──────────────── */}
          {activeTab === "admins" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Admin User Accounts & Security Roles</h3>
                  <p>Manage administrative team members and access roles.</p>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => handleOpenAdminUserModal()}>
                  <Plus size={16} /> Create Admin Account
                </button>
              </div>

              <DataTable
                columns={[
                  {
                    key: "username",
                    label: "Username",
                    render: (row) => <strong>{row.username}</strong>,
                  },
                  {
                    key: "email",
                    label: "Email Address",
                    render: (row) => <span>{row.email}</span>,
                  },
                  {
                    key: "role",
                    label: "Role",
                    render: (row) => <span className="category-tag">{row.role || "Admin"}</span>,
                  },
                  {
                    key: "is_active",
                    label: "Status",
                    render: (row) => (
                      <span style={{ color: row.is_active ? "#10B981" : "#EF4444", fontWeight: 700 }}>
                        {row.is_active ? "Active" : "Disabled"}
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
                          title="Edit Admin"
                          onClick={() => handleOpenAdminUserModal(row)}
                        >
                          <Edit2 size={16} />
                        </button>
                        {row.username !== "nova" && (
                          <button
                            className="action-icon-btn danger"
                            title="Delete Admin"
                            onClick={() => handleDeleteAdminUser(row)}
                          >
                            <Trash2 size={16} />
                          </button>
                        )}
                      </div>
                    ),
                  },
                ]}
                data={adminUsers}
                isLoading={isLoadingAdmins}
                emptyMessage="No admin accounts registered."
              />
            </div>
          )}

          {/* ──────────────── TAB 11: WEBP MEDIA STUDIO ──────────────── */}
          {activeTab === "webp" && (
            <div className="dashboard-tab-panel">
              <div className="panel-header">
                <div>
                  <h3>Automatic WebP Image Converter & CDN Uploader</h3>
                  <p>Convert PNG, JPG, or SVG images into optimized .webp files and upload to Supabase Storage.</p>
                </div>
              </div>

              <div className="webp-uploader-card">
                <div className="webp-dropzone" onClick={() => document.getElementById("admin-webp-input").click()}>
                  <input
                    id="admin-webp-input"
                    type="file"
                    style={{ display: "none" }}
                    accept="image/*"
                    onChange={handleWebpFileSelect}
                  />
                  <FileImage size={42} color="var(--blue-bell)" />
                  <h4>Select or Drag Any Image Here</h4>
                  <p>Automatic Client-Side HTML5 Canvas WebP Conversion</p>
                </div>

                <div className="folder-select-row">
                  <label>Target Storage Bucket Folder:</label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="folder-select"
                  >
                    <option value="products">products/</option>
                    <option value="categories">categories/</option>
                    <option value="hero">hero/</option>
                    <option value="ads">ads/</option>
                  </select>
                </div>

                {convertedWebP && (
                  <motion.div
                    className="webp-preview-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <img src={convertedWebP.dataUrl} alt="WebP" className="webp-preview-img" />
                    <div className="preview-info-col">
                      <div className="conversion-badge">
                        <CheckCircle2 size={16} color="#10B981" />
                        <span>Ready in Optimized .WEBP Format</span>
                      </div>

                      <div className="metrics-grid">
                        <div className="metric-box">
                          <span className="metric-label">Original</span>
                          <span className="metric-val">{(convertedWebP.originalSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="metric-box highlight">
                          <span className="metric-label">WebP</span>
                          <span className="metric-val">{(convertedWebP.webpSize / 1024).toFixed(1)} KB</span>
                        </div>
                        <div className="metric-box success">
                          <span className="metric-label">Saved</span>
                          <span className="metric-val">-{convertedWebP.compressionRatio}%</span>
                        </div>
                      </div>

                      <button
                        className="btn btn-primary btn-sm"
                        onClick={handleUploadWebP}
                        disabled={isUploadingWebp}
                      >
                        <UploadCloud size={16} />
                        {isUploadingWebp ? "Uploading to Storage..." : "Upload WebP to CDN"}
                      </button>
                    </div>
                  </motion.div>
                )}

                {uploadedWebpUrl && (
                  <motion.div
                    className="uploaded-url-card"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="url-header">
                      <CheckCircle2 size={16} color="#10B981" />
                      <span>Live CDN Link Saved:</span>
                    </div>
                    <div className="url-copy-box">
                      <input type="text" readOnly value={uploadedWebpUrl} className="url-input" />
                      <button className="copy-btn" onClick={handleCopyWebpLink}>
                        {copiedWebpUrl ? <Check size={16} /> : <Copy size={16} />}
                        <span>{copiedWebpUrl ? "Copied" : "Copy"}</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      {/* ──────────────── MODAL: PRODUCT CREATOR / EDITOR ──────────────── */}
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
                  <h4>{editingProduct ? `Edit Product #${editingProduct.id}` : "Create New Product"}</h4>
                  <p>Fill in product details and initial store specifications</p>
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
                        <label>Product Name (English)<span className="required">*</span></label>
                        <input
                          type="text"
                          value={prodForm.nameEn}
                          onChange={(e) => setProdForm({ ...prodForm, nameEn: e.target.value })}
                          placeholder="e.g. Nova Stealth 16 Ultra Laptop"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Product Name (Arabic)<span className="required">*</span></label>
                        <input
                          type="text"
                          value={prodForm.nameAr}
                          onChange={(e) => setProdForm({ ...prodForm, nameAr: e.target.value })}
                          placeholder="مثال: لابتوب نوفا ستيلث 16 الترا"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Subcategory<span className="required">*</span></label>
                        <select
                          value={prodForm.subcategoryId}
                          onChange={(e) => setProdForm({ ...prodForm, subcategoryId: Number(e.target.value) })}
                        >
                          {subcategories.map((sub) => (
                            <option key={sub.id} value={sub.id}>
                              {sub.categories?.name_en} &rarr; {sub.name_en}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="form-group">
                        <label>Assigned Supplier / Merchant</label>
                        <select
                          value={prodForm.supplierId}
                          onChange={(e) => setProdForm({ ...prodForm, supplierId: Number(e.target.value) })}
                        >
                          {suppliers.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.phone})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Hardware Condition</label>
                      <select
                        value={prodForm.condition}
                        onChange={(e) => setProdForm({ ...prodForm, condition: e.target.value })}
                      >
                        <option value="new">Brand New (Factory Sealed)</option>
                        <option value="refurbished">Certified Refurbished</option>
                        <option value="used">Used / Open Box</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Description (English)</label>
                      <textarea
                        rows={3}
                        value={prodForm.descriptionEn}
                        onChange={(e) => setProdForm({ ...prodForm, descriptionEn: e.target.value })}
                        placeholder="Comprehensive specs and features..."
                      />
                    </div>

                    <div className="form-group">
                      <label>Description (Arabic)</label>
                      <textarea
                        rows={3}
                        value={prodForm.descriptionAr}
                        onChange={(e) => setProdForm({ ...prodForm, descriptionAr: e.target.value })}
                        placeholder="تفاصيل ومواصفات الجهاز بالعربية..."
                      />
                    </div>

                    {/* ─── PRICING & STOCK CONTROLS ─── */}
                    <div className="form-grid-3" style={{ marginTop: "1rem" }}>
                      <div className="form-group">
                        <label>Retail Sale Price (EGP)*</label>
                        <input
                          type="number"
                          value={prodForm.salePrice}
                          onChange={(e) => setProdForm({ ...prodForm, salePrice: e.target.value })}
                          placeholder="e.g. 45000"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Vendor Cost (EGP)</label>
                        <input
                          type="number"
                          value={prodForm.vendorPrice}
                          onChange={(e) => setProdForm({ ...prodForm, vendorPrice: e.target.value })}
                          placeholder="e.g. 38000"
                        />
                      </div>

                      <div className="form-group">
                        <label>Stock Quantity (Units)*</label>
                        <input
                          type="number"
                          value={prodForm.stockQuantity}
                          onChange={(e) => setProdForm({ ...prodForm, stockQuantity: e.target.value })}
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
                              handleUploadImageFiles(e.target.files, false);
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
                      {(prodForm.images || []).length > 0 && (
                        <div className="uploaded-gallery-grid">
                          {prodForm.images.map((img, idx) => (
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
                                    setProdForm((prev) => ({
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
                                    setProdForm((prev) => {
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

                    <div className="form-checkbox-row" style={{ marginTop: "1rem" }}>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={prodForm.isBestSeller}
                          onChange={(e) => setProdForm({ ...prodForm, isBestSeller: e.target.checked })}
                        />
                        <span>Mark as Bestseller</span>
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={prodForm.isFeatured}
                          onChange={(e) => setProdForm({ ...prodForm, isFeatured: e.target.checked })}
                        />
                        <span>Feature on Homepage</span>
                      </label>

                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={prodForm.isActive}
                          onChange={(e) => setProdForm({ ...prodForm, isActive: e.target.checked })}
                        />
                        <span>Active in Store</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsProductModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={isUploadingImages}>
                    <Save size={16} /> {editingProduct ? "Save Product Changes" : "Publish Live Product"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: PRODUCT GALLERY (DIRECT WEBP UPLOAD ONLY) ──────────────── */}
      <AnimatePresence>
        {managingImagesProduct && (
          <div className="dashboard-modal-overlay" onClick={() => setManagingImagesProduct(null)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>Product Gallery: {managingImagesProduct.name_en}</h4>
                  <p>Direct WebP uploads converted and attached directly to Supabase CDN storage</p>
                </div>
                <button className="modal-close-btn" onClick={() => setManagingImagesProduct(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-scroll">
                <div className="product-images-grid">
                  {(managingImagesProduct.product_imgs || []).map((img) => (
                    <div key={img.id} className={`image-manage-card ${img.is_primary ? "primary" : ""}`}>
                      <img src={img.img_link} alt="Product media" />
                      <div className="image-card-controls">
                        {img.is_primary ? (
                          <span className="primary-pill">Primary Cover</span>
                        ) : (
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            style={{ padding: "2px 6px", fontSize: "0.7rem" }}
                            onClick={async () => {
                              try {
                                await updateProductImage(img.id, managingImagesProduct.id, { isPrimary: true });
                                const updated = await fetchAdminProducts();
                                setProductsList(updated);
                                setManagingImagesProduct(updated.find((p) => p.id === managingImagesProduct.id));
                              } catch (err) {
                                addToast(err.message, "error");
                              }
                            }}
                          >
                            Set Primary
                          </button>
                        )}
                        <button
                          type="button"
                          className="action-icon-btn danger"
                          onClick={async () => {
                            try {
                              await deleteProductImage(img.id);
                              const updated = await fetchAdminProducts();
                              setProductsList(updated);
                              setManagingImagesProduct(updated.find((p) => p.id === managingImagesProduct.id));
                            } catch (err) {
                              addToast(err.message, "error");
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="dashboard-content-box" style={{ marginTop: "1.5rem" }}>
                  <h5>Direct WebP Image Upload (No Manual Link Required)</h5>
                  <label className="direct-image-dropzone" style={{ marginTop: "0.75rem" }}>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      style={{ display: "none" }}
                      disabled={isUploadingImages}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          handleUploadImageFiles(e.target.files, true, managingImagesProduct.id);
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
                        ? "Converting & Uploading WebP to Product Gallery..."
                        : "Drag & drop photos here, or click to upload"}
                    </p>
                    <p className="dropzone-subtitle">
                      PNG/JPG files will be automatically compressed to WebP and saved directly to CDN.
                    </p>
                  </label>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: CATEGORY CREATOR / EDITOR ──────────────── */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingCategory ? `Edit Category: ${editingCategory.name_en}` : "Create Store Category"}</h4>
                  <p>Configure department branding and slug identifier</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsCategoryModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCategory}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Category Name (EN)*</label>
                        <input
                          type="text"
                          value={categoryForm.nameEn}
                          onChange={(e) => setCategoryForm({ ...categoryForm, nameEn: e.target.value })}
                          placeholder="e.g. Gaming Laptops"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Category Name (AR)*</label>
                        <input
                          type="text"
                          value={categoryForm.nameAr}
                          onChange={(e) => setCategoryForm({ ...categoryForm, nameAr: e.target.value })}
                          placeholder="مثال: لابتوبات ألعاب"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Slug Identifier</label>
                        <input
                          type="text"
                          value={categoryForm.slug}
                          onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                          placeholder="e.g. gaming-laptops"
                        />
                      </div>
                      <div className="form-group">
                        <label>Sort Order</label>
                        <input
                          type="number"
                          value={categoryForm.sortOrder}
                          onChange={(e) => setCategoryForm({ ...categoryForm, sortOrder: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <label style={{ margin: 0 }}>Department Banner / Thumbnail Image</label>
                        <span className="dropzone-badge" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          <CheckCircle2 size={12} color="#059669" /> Auto WebP CDN
                        </span>
                      </div>

                      {categoryForm.imgLink ? (
                        <div className="modal-image-preview-card">
                          <img
                            src={categoryForm.imgLink}
                            alt="Category Banner Preview"
                            className="modal-preview-thumb"
                          />
                          <div className="preview-overlay-actions">
                            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                              <UploadCloud size={14} /> Replace
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                disabled={isUploadingCategoryImg}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleUploadCategoryImg(e.target.files);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setCategoryForm((prev) => ({ ...prev, imgLink: "" }))}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`modal-direct-dropzone ${isUploadingCategoryImg ? "uploading" : ""}`}>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingCategoryImg}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleUploadCategoryImg(e.target.files);
                                e.target.value = "";
                              }
                            }}
                          />
                          <div className="dropzone-icon-circle">
                            {isUploadingCategoryImg ? (
                              <Loader2 size={24} className="spin" color="var(--blue-bell)" />
                            ) : (
                              <UploadCloud size={24} color="var(--blue-bell)" />
                            )}
                          </div>
                          <p className="dropzone-title">
                            {isUploadingCategoryImg
                              ? "Converting & Uploading WebP to Supabase CDN..."
                              : "Click or Drag & Drop Category Image Here"}
                          </p>
                          <p className="dropzone-subtitle">
                            PNG, JPG, WEBP formats supported. Automatic high-speed CDN upload.
                          </p>
                        </label>
                      )}

                      <div className="manual-url-fallback">
                        <input
                          type="text"
                          value={categoryForm.imgLink}
                          onChange={(e) => setCategoryForm({ ...categoryForm, imgLink: e.target.value })}
                          placeholder="Or paste external/Supabase CDN image URL..."
                          style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                        />
                      </div>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={categoryForm.isActive}
                          onChange={(e) => setCategoryForm({ ...categoryForm, isActive: e.target.checked })}
                        />
                        <span>Active Department in Navigation</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsCategoryModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Category
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: SUBCATEGORY CREATOR / EDITOR ──────────────── */}
      <AnimatePresence>
        {isSubcategoryModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsSubcategoryModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingSubcategory ? `Edit Subcategory: ${editingSubcategory.name_en}` : "Create Subcategory"}</h4>
                  <p>Attach subcategory under parent department</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsSubcategoryModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSubcategory}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-group">
                      <label>Parent Department Category*</label>
                      <select
                        value={subcategoryForm.categoryId}
                        onChange={(e) => setSubcategoryForm({ ...subcategoryForm, categoryId: Number(e.target.value) })}
                      >
                        {categoriesList.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name_en} ({c.name_ar})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Subcategory Title (EN)*</label>
                        <input
                          type="text"
                          value={subcategoryForm.nameEn}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, nameEn: e.target.value })}
                          placeholder="e.g. RTX 4080 Laptops"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Subcategory Title (AR)*</label>
                        <input
                          type="text"
                          value={subcategoryForm.nameAr}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, nameAr: e.target.value })}
                          placeholder="مثال: لابتوبات كارت 4080"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Slug Identifier</label>
                        <input
                          type="text"
                          value={subcategoryForm.slug}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, slug: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Sort Order</label>
                        <input
                          type="number"
                          value={subcategoryForm.sortOrder}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, sortOrder: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <label style={{ margin: 0 }}>Subcategory Image / Icon (Optional)</label>
                        <span className="dropzone-badge" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          <CheckCircle2 size={12} color="#059669" /> Auto WebP
                        </span>
                      </div>

                      {subcategoryForm.imgLink ? (
                        <div className="modal-image-preview-card">
                          <img
                            src={subcategoryForm.imgLink}
                            alt="Subcategory Preview"
                            className="modal-preview-thumb"
                          />
                          <div className="preview-overlay-actions">
                            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                              <UploadCloud size={14} /> Replace
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                disabled={isUploadingSubcategoryImg}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleUploadSubcategoryImg(e.target.files);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setSubcategoryForm((prev) => ({ ...prev, imgLink: "" }))}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`modal-direct-dropzone ${isUploadingSubcategoryImg ? "uploading" : ""}`}>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingSubcategoryImg}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleUploadSubcategoryImg(e.target.files);
                                e.target.value = "";
                              }
                            }}
                          />
                          <div className="dropzone-icon-circle">
                            {isUploadingSubcategoryImg ? (
                              <Loader2 size={24} className="spin" color="var(--blue-bell)" />
                            ) : (
                              <UploadCloud size={24} color="var(--blue-bell)" />
                            )}
                          </div>
                          <p className="dropzone-title">
                            {isUploadingSubcategoryImg
                              ? "Converting & Uploading WebP to Supabase CDN..."
                              : "Click or Drag & Drop Subcategory Image"}
                          </p>
                          <p className="dropzone-subtitle">
                            PNG, JPG, WEBP formats supported.
                          </p>
                        </label>
                      )}
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={subcategoryForm.isActive}
                          onChange={(e) => setSubcategoryForm({ ...subcategoryForm, isActive: e.target.checked })}
                        />
                        <span>Active Subcategory</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsSubcategoryModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Subcategory
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: SUPPLIER CREATOR / EDITOR ──────────────── */}
      <AnimatePresence>
        {isSupplierModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsSupplierModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingSupplier ? `Edit Supplier: ${editingSupplier.name}` : "Register Partner Supplier"}</h4>
                  <p>Configure vendor contact details and commission deduction</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsSupplierModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveSupplier}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Supplier / Company Name*</label>
                        <input
                          type="text"
                          value={supplierForm.name}
                          onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                          placeholder="e.g. Cairo Tech Hub"
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Contact Phone (Login ID)*</label>
                        <input
                          type="text"
                          value={supplierForm.phone}
                          onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                          placeholder="e.g. 01012345678"
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Official Email</label>
                        <input
                          type="email"
                          value={supplierForm.email}
                          onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          placeholder="vendor@novastore.com"
                        />
                      </div>
                      <div className="form-group">
                        <label>Platform Commission Rate (%)</label>
                        <input
                          type="number"
                          value={Math.round(supplierForm.commissionRate * 100)}
                          onChange={(e) => setSupplierForm({ ...supplierForm, commissionRate: Number(e.target.value) / 100 })}
                          min="0"
                          max="50"
                        />
                      </div>
                    </div>

                    {!editingSupplier && (
                      <div className="form-group">
                        <label>Initial Login Password*</label>
                        <input
                          type="password"
                          value={supplierForm.password}
                          onChange={(e) => setSupplierForm({ ...supplierForm, password: e.target.value })}
                          placeholder="Password for vendor portal"
                          required
                        />
                      </div>
                    )}

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={supplierForm.isActive}
                          onChange={(e) => setSupplierForm({ ...supplierForm, isActive: e.target.checked })}
                        />
                        <span>Active Partner Status</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsSupplierModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Supplier
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: COUPON WITH TARGET SCOPES ──────────────── */}
      <AnimatePresence>
        {isCouponModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsCouponModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingCoupon ? `Edit Coupon: ${editingCoupon.code}` : "Issue New Discount Coupon"}</h4>
                  <p>Configure percentage or fixed discount, targeted categories/products, and limits in EGP</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsCouponModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveCoupon}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Coupon Code (Uppercase)*</label>
                        <input
                          type="text"
                          value={couponForm.code}
                          onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                          placeholder="e.g. SUMMER25"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Discount Type</label>
                        <select
                          value={couponForm.discountType}
                          onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                        >
                          <option value="percentage">Percentage Cut (%)</option>
                          <option value="fixed">Fixed Amount (EGP)</option>
                        </select>
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Discount Value ({couponForm.discountType === "percentage" ? "%" : "EGP"})*</label>
                        <input
                          type="number"
                          value={couponForm.discountValue}
                          onChange={(e) => setCouponForm({ ...couponForm, discountValue: e.target.value })}
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Max Discount Cap (EGP)</label>
                        <input
                          type="number"
                          value={couponForm.maxDiscountAmount}
                          onChange={(e) => setCouponForm({ ...couponForm, maxDiscountAmount: e.target.value })}
                          placeholder="Optional cap for % discount"
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Minimum Order (EGP)</label>
                        <input
                          type="number"
                          value={couponForm.minOrderAmount}
                          onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: e.target.value })}
                          placeholder="0"
                        />
                      </div>

                      <div className="form-group">
                        <label>Total Redemption Limit</label>
                        <input
                          type="number"
                          value={couponForm.usageLimitTotal}
                          onChange={(e) => setCouponForm({ ...couponForm, usageLimitTotal: e.target.value })}
                          placeholder="Leave empty for unlimited"
                        />
                      </div>
                    </div>

                    {/* Target Scope Selection */}
                    <div className="form-group">
                      <label>Target Applicable Scope*</label>
                      <select
                        value={couponForm.targetScope}
                        onChange={(e) =>
                          setCouponForm({ ...couponForm, targetScope: e.target.value, targetedIds: [] })
                        }
                      >
                        <option value="entire_order">Entire Order (All Products)</option>
                        <option value="specific_categories">Specific Categories Only</option>
                        <option value="specific_products">Specific Products Only</option>
                      </select>
                    </div>

                    {/* Interactive Scope Multi-Select */}
                    {couponForm.targetScope === "specific_categories" && (
                      <div className="form-group">
                        <label>Select Eligible Categories ({couponForm.targetedIds.length} Selected):</label>
                        <div className="chip-selection-box">
                          {categoriesList.map((cat) => {
                            const isSelected = couponForm.targetedIds.includes(cat.id);
                            return (
                              <button
                                key={cat.id}
                                type="button"
                                className={`target-item-chip ${isSelected ? "selected" : ""}`}
                                onClick={() => {
                                  const updated = isSelected
                                    ? couponForm.targetedIds.filter((id) => id !== cat.id)
                                    : [...couponForm.targetedIds, cat.id];
                                  setCouponForm({ ...couponForm, targetedIds: updated });
                                }}
                              >
                                {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                <span>{cat.name_en} ({cat.name_ar})</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {couponForm.targetScope === "specific_products" && (
                      <div className="form-group">
                        <label>Select Eligible Products ({couponForm.targetedIds.length} Selected):</label>
                        <div className="chip-selection-box">
                          {productsList.map((p) => {
                            const isSelected = couponForm.targetedIds.includes(p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                className={`target-item-chip ${isSelected ? "selected" : ""}`}
                                onClick={() => {
                                  const updated = isSelected
                                    ? couponForm.targetedIds.filter((id) => id !== p.id)
                                    : [...couponForm.targetedIds, p.id];
                                  setCouponForm({ ...couponForm, targetedIds: updated });
                                }}
                              >
                                {isSelected ? <Check size={12} /> : <Plus size={12} />}
                                <span>{p.name_en}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Valid From</label>
                        <input
                          type="date"
                          value={couponForm.startDate}
                          onChange={(e) => setCouponForm({ ...couponForm, startDate: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Expires On (End of Day)</label>
                        <input
                          type="date"
                          value={couponForm.expireDate}
                          onChange={(e) => setCouponForm({ ...couponForm, expireDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={couponForm.isActive}
                          onChange={(e) => setCouponForm({ ...couponForm, isActive: e.target.checked })}
                        />
                        <span>Active for Checkout</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsCouponModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Coupon Code
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: COUPON USAGES ──────────────── */}
      <AnimatePresence>
        {viewingUsagesCoupon && (
          <div className="dashboard-modal-overlay" onClick={() => setViewingUsagesCoupon(null)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>Redemption History: {viewingUsagesCoupon.code}</h4>
                  <p>Customer orders and discounts applied using this coupon</p>
                </div>
                <button className="modal-close-btn" onClick={() => setViewingUsagesCoupon(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-scroll">
                <table className="admin-orders-table">
                  <thead>
                    <tr>
                      <th>Order Code</th>
                      <th>Customer Name</th>
                      <th>Phone</th>
                      <th>Discount Applied</th>
                      <th>Redemption Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {couponUsages.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: "center", padding: "2rem" }}>
                          No redemptions logged yet.
                        </td>
                      </tr>
                    ) : (
                      couponUsages.map((u) => (
                        <tr key={u.id}>
                          <td><strong>{u.orders?.order_code || `#${u.order_id}`}</strong></td>
                          <td>{u.orders?.customer_name || "Customer"}</td>
                          <td>{u.customer_phone}</td>
                          <td><strong style={{ color: "#059669" }}>-{Number(u.discount_applied).toLocaleString()} EGP</strong></td>
                          <td>{new Date(u.used_at).toLocaleString()}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: OFFER CREATOR / EDITOR ──────────────── */}
      <AnimatePresence>
        {isOfferModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsOfferModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingOffer ? "Edit Promotional Deal" : "Create Product Deal"}</h4>
                  <p>Schedule percentage discounts on specific products</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsOfferModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveOffer}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-group">
                      <label>Offer Headline*</label>
                      <input
                        type="text"
                        value={offerForm.offerTitle}
                        onChange={(e) => setOfferForm({ ...offerForm, offerTitle: e.target.value })}
                        placeholder="e.g. Mega Weekend Special 20% Off"
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Target Product*</label>
                      <select
                        value={offerForm.productId}
                        onChange={(e) => {
                          const prod = productsList.find((p) => p.id === Number(e.target.value));
                          const basePrice = Number(prod?.sale_price || 1000);
                          setOfferForm({
                            ...offerForm,
                            productId: e.target.value,
                            priceAfterOffer: Math.round(basePrice * (1 - offerForm.offerPercent / 100)),
                          });
                        }}
                      >
                        {productsList.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name_en} ({Number(p.sale_price || 0).toLocaleString()} EGP)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Discount Percent (%)*</label>
                        <input
                          type="number"
                          value={offerForm.offerPercent}
                          onChange={(e) => {
                            const pct = Number(e.target.value);
                            const prod = productsList.find((p) => p.id === Number(offerForm.productId));
                            const basePrice = Number(prod?.sale_price || 1000);
                            setOfferForm({
                              ...offerForm,
                              offerPercent: pct,
                              priceAfterOffer: Math.round(basePrice * (1 - pct / 100)),
                            });
                          }}
                          min="1"
                          max="90"
                          required
                        />
                      </div>

                      <div className="form-group">
                        <label>Deal Price (EGP)*</label>
                        <input
                          type="number"
                          value={offerForm.priceAfterOffer}
                          onChange={(e) => setOfferForm({ ...offerForm, priceAfterOffer: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Campaign Start</label>
                        <input
                          type="date"
                          value={offerForm.offerStart}
                          onChange={(e) => setOfferForm({ ...offerForm, offerStart: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Campaign End</label>
                        <input
                          type="date"
                          value={offerForm.offerEnd}
                          onChange={(e) => setOfferForm({ ...offerForm, offerEnd: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={offerForm.isFeatured}
                          onChange={(e) => setOfferForm({ ...offerForm, isFeatured: e.target.checked })}
                        />
                        <span>Feature on Homepage Deals Bar</span>
                      </label>
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={offerForm.isActive}
                          onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                        />
                        <span>Active</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsOfferModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Deal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: SUPPLIER PASSWORD CHANGE (ADMIN VERIFIED) ──────────────── */}
      <AnimatePresence>
        {isPasswordModalOpen && passwordSupplier && (
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
                  <h4>Reset Password: {passwordSupplier.name}</h4>
                  <p>Security verification: Enter your admin password to authorize changing this supplier's password</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsPasswordModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleChangeSupplierPassword}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-group">
                      <label>Supplier Account</label>
                      <input
                        type="text"
                        disabled
                        value={`${passwordSupplier.name} (${passwordSupplier.phone})`}
                        style={{ opacity: 0.75, background: "#F1F5F9" }}
                      />
                    </div>

                    <div className="form-group">
                      <label>New Supplier Password*</label>
                      <input
                        type="password"
                        required
                        minLength={6}
                        placeholder="Enter new supplier password (min 6 chars)..."
                        value={newSupplierPassword}
                        onChange={(e) => setNewSupplierPassword(e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginTop: "1.25rem", borderTop: "1px dashed var(--border-light)", paddingTop: "1rem" }}>
                      <label style={{ color: "#D97706", fontWeight: 700 }}>
                        <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
                        Admin Password (Verification Field)*
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="Enter YOUR admin login password to confirm..."
                        value={adminVerificationPassword}
                        onChange={(e) => setAdminVerificationPassword(e.target.value)}
                      />
                      <span className="subtext" style={{ color: "#64748B" }}>
                        Required to verify you are an authorized administrator.
                      </span>
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

      {/* ──────────────── MODAL: SUPPLIER POLICIES (SHIPPING & RETURNS) ──────────────── */}
      <AnimatePresence>
        {isPoliciesModalOpen && policiesSupplier && (
          <div className="dashboard-modal-overlay" onClick={() => setIsPoliciesModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>Shipping & Return Policies: {policiesSupplier.name}</h4>
                  <p>Configure storewide delivery rates and return/warranty conditions for this vendor</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsPoliciesModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body-scroll">
                {isPoliciesLoading ? (
                  <div style={{ textAlign: "center", padding: "2rem" }}>
                    <RefreshCw size={24} className="spin" />
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    {/* Shipping Rates Section */}
                    <div>
                      <h5 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--prussian-blue)" }}>
                        Storewide Shipping Rate
                      </h5>
                      <form onSubmit={handleSaveShippingRate} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "0.5rem", alignItems: "end", marginBottom: "1rem" }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "0.8rem" }}>Cost (EGP)</label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={policyShippingCost}
                            onChange={(e) => setPolicyShippingCost(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "0.8rem" }}>Min Days</label>
                          <input
                            type="number"
                            min="1"
                            value={policyMinDays}
                            onChange={(e) => setPolicyMinDays(Number(e.target.value))}
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label style={{ fontSize: "0.8rem" }}>Max Days</label>
                          <input
                            type="number"
                            min="1"
                            value={policyMaxDays}
                            onChange={(e) => setPolicyMaxDays(Number(e.target.value))}
                          />
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ height: 40 }}>
                          <Plus size={14} /> {editingPolicyId ? "Update Rate" : "Save Rate"}
                        </button>
                      </form>

                      <div style={{ border: "1px solid var(--border-light)", borderRadius: 6, overflow: "hidden" }}>
                        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
                          <thead>
                            <tr style={{ background: "#F8FAFC", borderBottom: "1px solid var(--border-light)", textAlign: "left" }}>
                              <th style={{ padding: "8px 12px" }}>Coverage</th>
                              <th style={{ padding: "8px 12px" }}>Shipping Fee</th>
                              <th style={{ padding: "8px 12px" }}>Estimated SLA</th>
                              <th style={{ padding: "8px 12px", textAlign: "right" }}>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {supplierShippingPolicies.length === 0 ? (
                              <tr>
                                <td colSpan={4} style={{ padding: 16, textAlign: "center", color: "#64748B" }}>
                                  No storewide shipping policy configured.
                                </td>
                              </tr>
                            ) : (
                              supplierShippingPolicies.map((sp) => (
                                <tr key={sp.id} style={{ borderBottom: "1px solid var(--border-light)" }}>
                                  <td style={{ padding: "8px 12px", fontWeight: 600 }}>All destinations</td>
                                  <td style={{ padding: "8px 12px" }}>{sp.shipping_cost} EGP</td>
                                  <td style={{ padding: "8px 12px" }}>{sp.estimated_days_min || 1} - {sp.estimated_days_max || 3} days</td>
                                  <td style={{ padding: "8px 12px", textAlign: "right" }}>
                                    <div className="table-actions-cell">
                                      <button
                                        type="button"
                                        className="action-icon-btn"
                                        title="Edit shipping rate"
                                        onClick={() => {
                                          setEditingPolicyId(sp.id);
                                          setPolicyShippingCost(Number(sp.shipping_cost) || 0);
                                          setPolicyMinDays(sp.estimated_days_min || 1);
                                          setPolicyMaxDays(sp.estimated_days_max || 3);
                                        }}
                                      >
                                        <Edit2 size={14} />
                                      </button>
                                      <button
                                        type="button"
                                        className="action-icon-btn danger"
                                        title="Delete shipping rate"
                                        onClick={() => handleDeleteShippingRate(sp.id)}
                                      >
                                        <Trash2 size={14} />
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Return Policy Section */}
                    <div style={{ borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
                      <h5 style={{ fontSize: "1.1rem", marginBottom: "0.75rem", color: "var(--prussian-blue)" }}>
                        Return & Warranty Terms
                      </h5>
                      <form onSubmit={handleSaveReturnSettings}>
                        <div className="form-grid-2">
                          <div className="form-group">
                            <label>Return / Exchange Window (Days)</label>
                            <input
                              type="number"
                              min="0"
                              max="90"
                              value={returnDaysVal}
                              onChange={(e) => setReturnDaysVal(Number(e.target.value))}
                            />
                          </div>
                          <div className="form-group">
                            <label>Warranty Coverage (Months)</label>
                            <input
                              type="number"
                              min="0"
                              max="60"
                              value={warrantyMonthsVal}
                              onChange={(e) => setWarrantyMonthsVal(Number(e.target.value))}
                            />
                          </div>
                        </div>
                        <button type="submit" className="btn btn-primary btn-sm" style={{ marginTop: "0.5rem" }}>
                          <Save size={14} /> Save Return Terms
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsPoliciesModalOpen(false)}>
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: ADMIN USER ──────────────── */}
      <AnimatePresence>
        {isAdminUserModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsAdminUserModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingAdminUser ? `Edit Admin: ${editingAdminUser.username}` : "Create Admin Account"}</h4>
                  <p>Security role & access permissions</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsAdminUserModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAdminUser}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Username*</label>
                        <input
                          type="text"
                          value={adminUserForm.username}
                          onChange={(e) => setAdminUserForm({ ...adminUserForm, username: e.target.value })}
                          disabled={Boolean(editingAdminUser)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Email Address*</label>
                        <input
                          type="email"
                          value={adminUserForm.email}
                          onChange={(e) => setAdminUserForm({ ...adminUserForm, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    {!editingAdminUser && (
                      <div className="form-group">
                        <label>Initial Password*</label>
                        <input
                          type="password"
                          value={adminUserForm.password}
                          onChange={(e) => setAdminUserForm({ ...adminUserForm, password: e.target.value })}
                          required
                        />
                      </div>
                    )}

                    <div className="form-group">
                      <label>Role</label>
                      <select
                        value={adminUserForm.role}
                        onChange={(e) => setAdminUserForm({ ...adminUserForm, role: e.target.value })}
                      >
                        <option value="admin">Administrator</option>
                        <option value="superadmin">Super Administrator</option>
                      </select>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={adminUserForm.isActive}
                          onChange={(e) => setAdminUserForm({ ...adminUserForm, isActive: e.target.checked })}
                        />
                        <span>Active Account</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsAdminUserModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Admin
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: TRUST PROPOSITION ──────────────── */}
      <AnimatePresence>
        {isTrustModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsTrustModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingTrustProp ? "Edit Trust Pillar" : "Add Trust Pillar"}</h4>
                  <p>Bilingual proposition shown across the footer & product pages</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsTrustModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveTrustProp}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Title (EN)*</label>
                        <input
                          type="text"
                          value={trustForm.titleEn}
                          onChange={(e) => setTrustForm({ ...trustForm, titleEn: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Title (AR)*</label>
                        <input
                          type="text"
                          value={trustForm.titleAr}
                          onChange={(e) => setTrustForm({ ...trustForm, titleAr: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Description (EN)*</label>
                      <textarea
                        rows={2}
                        value={trustForm.descriptionEn}
                        onChange={(e) => setTrustForm({ ...trustForm, descriptionEn: e.target.value })}
                        required
                      />
                    </div>

                    <div className="form-group">
                      <label>Description (AR)*</label>
                      <textarea
                        rows={2}
                        value={trustForm.descriptionAr}
                        onChange={(e) => setTrustForm({ ...trustForm, descriptionAr: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsTrustModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Trust Pillar
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: HERO SLIDE ──────────────── */}
      <AnimatePresence>
        {isHeroModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsHeroModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card large"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingHeroSlide ? "Edit Hero Banner" : "Create Hero Slide"}</h4>
                  <p>Design carousel headlines, CTA links, and CDN media</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsHeroModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveHeroSlide}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Headline (English)*</label>
                        <input
                          type="text"
                          value={heroForm.titleEn}
                          onChange={(e) => setHeroForm({ ...heroForm, titleEn: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Headline (Arabic)*</label>
                        <input
                          type="text"
                          value={heroForm.titleAr}
                          onChange={(e) => setHeroForm({ ...heroForm, titleAr: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Subtitle (English)</label>
                        <input
                          type="text"
                          value={heroForm.subtitleEn}
                          onChange={(e) => setHeroForm({ ...heroForm, subtitleEn: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Subtitle (Arabic)</label>
                        <input
                          type="text"
                          value={heroForm.subtitleAr}
                          onChange={(e) => setHeroForm({ ...heroForm, subtitleAr: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Tag Badge (EN)</label>
                        <input
                          type="text"
                          value={heroForm.tagBadgeEn}
                          onChange={(e) => setHeroForm({ ...heroForm, tagBadgeEn: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Tag Badge (AR)</label>
                        <input
                          type="text"
                          value={heroForm.tagBadgeAr}
                          onChange={(e) => setHeroForm({ ...heroForm, tagBadgeAr: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <label style={{ margin: 0 }}>Desktop Hero Banner Image (WebP CDN)*</label>
                        <span className="dropzone-badge" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>
                          <CheckCircle2 size={12} color="#059669" /> Pure WebP Auto-Converter
                        </span>
                      </div>

                      {heroForm.desktopImage ? (
                        <div className="modal-image-preview-card hero">
                          <img
                            src={heroForm.desktopImage}
                            alt="Hero Banner Preview"
                            className="modal-preview-hero-thumb"
                          />
                          <div className="preview-overlay-actions">
                            <label className="btn btn-primary btn-sm" style={{ cursor: "pointer" }}>
                              <UploadCloud size={14} /> Replace Banner
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: "none" }}
                                disabled={isUploadingHeroImage}
                                onChange={(e) => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    handleUploadHeroImage(e.target.files);
                                    e.target.value = "";
                                  }
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              className="btn btn-danger btn-sm"
                              onClick={() => setHeroForm((prev) => ({ ...prev, desktopImage: "" }))}
                            >
                              <Trash2 size={14} /> Remove
                            </button>
                          </div>
                        </div>
                      ) : (
                        <label className={`modal-direct-dropzone ${isUploadingHeroImage ? "uploading" : ""}`}>
                          <input
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            disabled={isUploadingHeroImage}
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 0) {
                                handleUploadHeroImage(e.target.files);
                                e.target.value = "";
                              }
                            }}
                          />
                          <div className="dropzone-icon-circle">
                            {isUploadingHeroImage ? (
                              <Loader2 size={26} className="spin" color="var(--blue-bell)" />
                            ) : (
                              <UploadCloud size={26} color="var(--blue-bell)" />
                            )}
                          </div>
                          <p className="dropzone-title">
                            {isUploadingHeroImage
                              ? "Converting Image to WebP & Uploading to Supabase CDN..."
                              : "Click or Drag & Drop Hero Banner Image Here"}
                          </p>
                          <p className="dropzone-subtitle">
                            Recommended size: 1920x800px. Supports PNG, JPG, WEBP. Instant CDN conversion.
                          </p>
                        </label>
                      )}

                      <div className="manual-url-fallback">
                        <input
                          type="text"
                          value={heroForm.desktopImage}
                          onChange={(e) => setHeroForm({ ...heroForm, desktopImage: e.target.value })}
                          placeholder="/Assets/Images/heros/hero1.jpeg or paste Supabase CDN image URL..."
                          style={{ marginTop: "0.5rem", fontSize: "0.8rem" }}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Primary CTA Text (EN)</label>
                        <input
                          type="text"
                          value={heroForm.primaryCtaTextEn}
                          onChange={(e) => setHeroForm({ ...heroForm, primaryCtaTextEn: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Primary CTA Link</label>
                        <input
                          type="text"
                          value={heroForm.primaryCtaLink}
                          onChange={(e) => setHeroForm({ ...heroForm, primaryCtaLink: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={heroForm.isActive}
                          onChange={(e) => setHeroForm({ ...heroForm, isActive: e.target.checked })}
                        />
                        <span>Active Banner in Carousel</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsHeroModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Banner
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ──────────────── MODAL: PROMO AD TICKER ──────────────── */}
      <AnimatePresence>
        {isAdModalOpen && (
          <div className="dashboard-modal-overlay" onClick={() => setIsAdModalOpen(false)}>
            <motion.div
              className="dashboard-modal-card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h4>{editingAd ? "Edit Promo Ad" : "Create Ticker Ad"}</h4>
                  <p>Floating vertical promo segment ticker bar</p>
                </div>
                <button className="modal-close-btn" onClick={() => setIsAdModalOpen(false)}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveAd}>
                <div className="modal-body-scroll">
                  <div className="admin-product-form">
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Title (English)*</label>
                        <input
                          type="text"
                          value={adForm.titleEn}
                          onChange={(e) => setAdForm({ ...adForm, titleEn: e.target.value })}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label>Title (Arabic)*</label>
                        <input
                          type="text"
                          value={adForm.titleAr}
                          onChange={(e) => setAdForm({ ...adForm, titleAr: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="form-group">
                      <label>Subtitle (English)</label>
                      <input
                        type="text"
                        value={adForm.subtitleEn}
                        onChange={(e) => setAdForm({ ...adForm, subtitleEn: e.target.value })}
                      />
                    </div>

                    <div className="form-grid-2">
                      <div className="form-group">
                        <label>Badge Pill Text (EN)</label>
                        <input
                          type="text"
                          value={adForm.badgeTextEn}
                          onChange={(e) => setAdForm({ ...adForm, badgeTextEn: e.target.value })}
                        />
                      </div>
                      <div className="form-group">
                        <label>Badge Pill Text (AR)</label>
                        <input
                          type="text"
                          value={adForm.badgeTextAr}
                          onChange={(e) => setAdForm({ ...adForm, badgeTextAr: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="form-checkbox-row">
                      <label className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={adForm.isActive}
                          onChange={(e) => setAdForm({ ...adForm, isActive: e.target.checked })}
                        />
                        <span>Active Ticker Slide</span>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="btn btn-outline" onClick={() => setIsAdModalOpen(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    <Save size={16} /> Save Promo Ad
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
