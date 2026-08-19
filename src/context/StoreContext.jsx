import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { calculateCartTotals } from "../data/storeData";
import {
  fetchProducts,
  fetchCategories,
  fetchHeroSlides,
  fetchPromotionalAds,
  validateCoupon,
  submitOrder,
} from "../services/storeService";

const StoreContext = createContext();

export function StoreProvider({ children }) {
  // Live Supabase Data State
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [heroSlides, setHeroSlides] = useState([
    {
      id: 1,
      tag: "Everything you're looking for",
      tagAr: "كل اللي بتدور عليه",
      title: "Powerful Products ......Best Prices",
      titleAr: "منتجات قوية ..بأسعار تنافسية",
      subtitle: "A selection of the latest and most powerful products—meeting your needs and fitting your budget.",
      subtitleAr: "تشكيلة بأحدث واقوي المنتجات .. تغطي احتياجاتك وتتماشي مع ميزانيتك",
      image: "/Assets/Images/heros/hero1.webp",
      primaryCtaText: "Explore Now",
      primaryCtaTextAr: "استكشف الآن",
      primaryCtaLink: "/product/1",
      secondaryCtaText: "Shop All Gear",
      secondaryCtaTextAr: "تسوق كل الأجهزة",
      secondaryCtaLink: "/catalog",
    },
    {
      id: 2,
      tag: "We understand your needs well.",
      tagAr: "عارفين احتياجاتك كويس",
      title: "Product quality is the hallmark of our success.",
      titleAr: "جودة المنتج هي عنوان نجاحنا",
      subtitle: "We help you choose what suits your needs and fits your budget.",
      subtitleAr: "بنساعدك تختار اللي يناسب احتياجاتك واللي في متناول ايدك",
      image: "/Assets/Images/heros/hero2.webp",
      primaryCtaText: "Explore Now",
      primaryCtaTextAr: "استكشف الآن",
      primaryCtaLink: "/product/4",
      secondaryCtaText: "Shop All Gear",
      secondaryCtaTextAr: "تسوق كل الأجهزة",
      secondaryCtaLink: "/catalog",
    },
  ]);
  const [promotionalAds, setPromotionalAds] = useState([]);
  const [isDbLoading, setIsDbLoading] = useState(true);

  // Admin Modal
  const [isAdminOpen, setIsAdminOpen] = useState(false);

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem("nova_react_cart");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [appliedCoupon, setAppliedCoupon] = useState(() => {
    return localStorage.getItem("nova_react_coupon") || null;
  });
  const [couponDetails, setCouponDetails] = useState(null);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [pdpProductId, setPdpProductId] = useState(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith("/product/")) {
        return path.replace("/product/", "").replace(/\/$/, "");
      }
    } catch {
      /* ignore */
    }
    return null;
  });

  const [currentRoute, setCurrentRoute] = useState(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace("#", "").replace("/", "");
      const search = new URLSearchParams(window.location.search);
      const page = search.get("page")?.toLowerCase();

      if (path === "/admin" || path.startsWith("/admin/") || hash === "admin" || page === "admin") {
        return "admin-dashboard";
      }
      if (path === "/vendor" || path.startsWith("/vendor/") || path === "/supplier" || path.startsWith("/supplier/") || hash === "vendor" || hash === "supplier" || page === "vendor" || page === "supplier") {
        return "supplier-dashboard";
      }
      if (path === "/catalog" || path.startsWith("/catalog/") || hash === "catalog" || page === "catalog") {
        return "catalog";
      }
      if (path === "/checkout" || path.startsWith("/checkout/") || hash === "checkout" || page === "checkout") {
        return "checkout";
      }
      if (path.startsWith("/product/")) {
        return "product";
      }
    } catch {
      /* ignore */
    }
    return "home";
  });

  // Compare List State
  const [compareList, setCompareList] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);

  // Filter States
  const [activeCategory, setActiveCategory] = useState(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const cat = search.get("category");
      if (cat) return cat;
      const path = window.location.pathname.toLowerCase();
      if (path.startsWith("/catalog/")) {
        return path.replace("/catalog/", "").split("/")[0] || "all";
      }
    } catch {
      /* ignore */
    }
    return "all";
  });

  const [activeSubcategory, setActiveSubcategory] = useState(() => {
    try {
      const search = new URLSearchParams(window.location.search);
      const sub = search.get("subcategory");
      if (sub) return sub;
    } catch {
      /* ignore */
    }
    return "all";
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [maxPrice, setMaxPrice] = useState(150000);
  const [sortBy, setSortBy] = useState("relevance");
  const [toasts, setToasts] = useState([]);

  // Fetch live store data from Supabase on mount
  const loadSupabaseData = useCallback(async () => {
    setIsDbLoading(true);
    try {
      const [dbProds, dbCats, dbSlides, dbAds] = await Promise.allSettled([
        fetchProducts(),
        fetchCategories(),
        fetchHeroSlides(),
        fetchPromotionalAds(),
      ]);

      if (dbProds.status === "fulfilled" && dbProds.value) {
        setProducts(dbProds.value);
      }
      if (dbCats.status === "fulfilled" && dbCats.value) {
        setCategories(dbCats.value);
      }
      if (dbSlides.status === "fulfilled" && dbSlides.value) {
        setHeroSlides(dbSlides.value);
      }
      if (dbAds.status === "fulfilled" && dbAds.value) {
        setPromotionalAds(dbAds.value);
      }
    } catch (err) {
      console.warn("Supabase store data fetch error:", err);
    } finally {
      setIsDbLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSupabaseData();
  }, [loadSupabaseData]);

  // Save Cart to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem("nova_react_cart", JSON.stringify(cart));
    } catch {
      /* ignore */
    }
  }, [cart]);

  // Save Coupon to LocalStorage
  useEffect(() => {
    try {
      if (appliedCoupon) {
        localStorage.setItem("nova_react_coupon", appliedCoupon);
      } else {
        localStorage.removeItem("nova_react_coupon");
      }
    } catch {
      /* ignore */
    }
  }, [appliedCoupon]);

  // Global URL Path & Hash Route Sync
  useEffect(() => {
    const handleUrlRouteSync = () => {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase().replace("#", "").replace("/", "");
      const search = new URLSearchParams(window.location.search);
      const page = search.get("page")?.toLowerCase();

      if (path === "/admin" || path.startsWith("/admin/") || hash === "admin" || page === "admin") {
        setCurrentRoute("admin-dashboard");
      } else if (
        path === "/vendor" ||
        path.startsWith("/vendor/") ||
        path === "/supplier" ||
        path.startsWith("/supplier/") ||
        hash === "vendor" ||
        hash === "supplier" ||
        page === "vendor" ||
        page === "supplier"
      ) {
        setCurrentRoute("supplier-dashboard");
      } else if (path === "/catalog" || path.startsWith("/catalog/") || hash === "catalog" || page === "catalog") {
        const catFromQuery = search.get("category");
        const subFromQuery = search.get("subcategory");
        const catFromPath = path.startsWith("/catalog/") ? path.replace("/catalog/", "").split("/")[0] : null;

        if (catFromQuery) setActiveCategory(catFromQuery);
        else if (catFromPath) setActiveCategory(catFromPath);

        if (subFromQuery) setActiveSubcategory(subFromQuery);

        setCurrentRoute("catalog");
      } else if (path === "/checkout" || path.startsWith("/checkout/") || hash === "checkout" || page === "checkout") {
        setCurrentRoute("checkout");
      } else if (path.startsWith("/product/")) {
        const prodId = path.replace("/product/", "").replace(/\/$/, "");
        if (prodId) setPdpProductId(prodId);
        setCurrentRoute("product");
      } else {
        setCurrentRoute("home");
      }
    };

    handleUrlRouteSync();
    window.addEventListener("popstate", handleUrlRouteSync);
    window.addEventListener("hashchange", handleUrlRouteSync);
    return () => {
      window.removeEventListener("popstate", handleUrlRouteSync);
      window.removeEventListener("hashchange", handleUrlRouteSync);
    };
  }, []);

  // Global Keyboard Shortcut: Ctrl + Shift + A for Admin Modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === "A" || e.key === "a")) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Toast Notifier
  const addToast = useCallback((message, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3200);
  }, []);

  // Cart Handlers
  const addToCart = useCallback(
    (productId, quantity = 1) => {
      const product = products.find(
        (p) =>
          p.id?.toString() === productId?.toString() ||
          p.dbId?.toString() === productId?.toString()
      );
      if (!product) return;

      const cartItemId = product.id.toString();
      const itemPrice = Number(product.price || product.sale_price || 999);

      setCart((prev) => {
        const existing = prev.find((item) => item.id === cartItemId);
        if (existing) {
          return prev.map((item) =>
            item.id === cartItemId
              ? { ...item, quantity: item.quantity + quantity }
              : item
          );
        }
        return [
          ...prev,
          {
            id: cartItemId,
            productId: product.id,
            product,
            name: product.name,
            nameAr: product.nameAr,
            price: itemPrice,
            originalPrice: product.originalPrice,
            image: product.image,
            quantity,
          },
        ];
      });
      addToast(`Added ${product.name} to cart!`);
    },
    [products, addToast]
  );

  const updateCartQty = useCallback((cartItemId, delta) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === cartItemId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  }, []);

  const removeFromCart = useCallback(
    (cartItemId) => {
      setCart((prev) => prev.filter((item) => item.id !== cartItemId));
      addToast("Item removed from cart", "info");
    },
    [addToast]
  );

  const clearCart = useCallback(() => {
    setCart([]);
    addToast("Cart cleared", "info");
  }, [addToast]);

  // Coupon Handlers with Supabase verification
  const applyCoupon = useCallback(
    async (code) => {
      const subtotal = cart.reduce((sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1), 0);
      const res = await validateCoupon(code, subtotal, cart);

      if (res.valid) {
        setAppliedCoupon(code.toUpperCase());
        setCouponDetails(res);
        addToast(`Coupon "${code.toUpperCase()}" applied successfully!`);
        return true;
      }

      addToast(res.message || "Invalid coupon code.", "error");
      return false;
    },
    [cart, addToast]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponDetails(null);
    addToast("Coupon code removed", "info");
  }, [addToast]);

  // Compare Handlers
  const toggleCompare = useCallback(
    (productId) => {
      setCompareList((prev) => {
        if (prev.includes(productId)) {
          return prev.filter((id) => id !== productId);
        }
        if (prev.length >= 4) {
          addToast("You can compare up to 4 items at a time", "warning");
          return prev;
        }
        return [...prev, productId];
      });
    },
    [addToast]
  );

  const clearCompare = useCallback(() => {
    setCompareList([]);
  }, []);

  // Navigation Helper with History API Push
  const navigateTo = useCallback((route, params = {}) => {
    let targetPath = "/";

    if (route === "product" && params.id) {
      setPdpProductId(params.id.toString());
      targetPath = `/product/${params.id}`;
    } else if (route === "catalog") {
      if (params.category) {
        setActiveCategory(params.category);
        targetPath = `/catalog?category=${encodeURIComponent(params.category)}`;
      } else {
        setActiveCategory("all");
        targetPath = "/catalog";
      }
      if (params.subcategory) {
        setActiveSubcategory(params.subcategory);
        targetPath += `&subcategory=${encodeURIComponent(params.subcategory)}`;
      } else {
        setActiveSubcategory("all");
      }
    } else if (route === "checkout") {
      targetPath = "/checkout";
    } else if (route === "admin-dashboard") {
      targetPath = "/admin";
    } else if (route === "supplier-dashboard") {
      targetPath = "/vendor";
    } else if (route === "home") {
      targetPath = "/";
    }

    try {
      if (window.location.pathname !== targetPath) {
        window.history.pushState({ route, params }, "", targetPath);
      }
    } catch {
      /* ignore */
    }

    setCurrentRoute(route);
    window.scrollTo({ top: 0, behavior: "auto" });
  }, []);

  const cartTotals = useMemo(
    () => calculateCartTotals(cart, appliedCoupon, couponDetails),
    [cart, appliedCoupon, couponDetails]
  );

  const value = useMemo(
    () => ({
      products,
      categories,
      heroSlides,
      promotionalAds,
      isDbLoading,
      refreshStoreData: loadSupabaseData,
      isAdminOpen,
      setIsAdminOpen,
      cart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      appliedCoupon,
      couponDetails,
      applyCoupon,
      removeCoupon,
      compareList,
      toggleCompare,
      clearCompare,
      isCompareOpen,
      setIsCompareOpen,
      cartTotals,
      isCartOpen,
      setIsCartOpen,
      currentRoute,
      navigateTo,
      pdpProductId,
      activeCategory,
      setActiveCategory,
      setSelectedCategory: setActiveCategory,
      activeSubcategory,
      setActiveSubcategory,
      setSelectedSubcategory: setActiveSubcategory,
      searchQuery,
      setSearchQuery,
      maxPrice,
      setMaxPrice,
      setPriceRange: setMaxPrice,
      sortBy,
      setSortBy,
      toasts,
      addToast,
      submitOrder,
    }),
    [
      products,
      categories,
      heroSlides,
      promotionalAds,
      isDbLoading,
      loadSupabaseData,
      isAdminOpen,
      cart,
      addToCart,
      updateCartQty,
      removeFromCart,
      clearCart,
      appliedCoupon,
      couponDetails,
      applyCoupon,
      removeCoupon,
      compareList,
      toggleCompare,
      clearCompare,
      isCompareOpen,
      cartTotals,
      isCartOpen,
      currentRoute,
      navigateTo,
      pdpProductId,
      activeCategory,
      activeSubcategory,
      searchQuery,
      maxPrice,
      sortBy,
      toasts,
      addToast,
    ]
  );

  return (
    <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
  );
}

export function useStore() {
  return useContext(StoreContext);
}
