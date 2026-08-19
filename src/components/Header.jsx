import React, { useState, useEffect, useRef, useMemo } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Search,
  ShoppingBag,
  Menu,
  X,
  Grid,
  Laptop,
  Monitor,
  Cpu,
  Headphones,
  ArrowRight,
  ChevronDown,
  Globe,
  Lock,
  Building,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
  const {
    cart,
    setIsCartOpen,
    currentRoute,
    navigateTo,
    searchQuery,
    setSearchQuery,
    products = [],
    categories = [],
  } = useStore();
  const { t, toggleLang, isRtl } = useLanguage();

  const [isScrolled, setIsScrolled] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeHoverCategory, setActiveHoverCategory] = useState(null);

  const searchRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /* close autocomplete on outside click */
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Mega menu hover handlers with delay buffer */
  const handleMouseEnterNav = (catId) => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    const cat = categories.find(
      (c) =>
        c.slug === catId ||
        c.id === catId ||
        c.id?.toString() === catId?.toString()
    );
    setActiveHoverCategory(cat || null);
  };

  const handleMouseLeaveNav = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setActiveHoverCategory(null);
    }, 200);
  };

  const handleMenuKeepOpen = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const totalCartCount = cart.reduce((s, i) => s + i.quantity, 0);

  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (q.length < 2) return [];
    return products
      .filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.nameAr && p.nameAr.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.description && p.description.toLowerCase().includes(q))
      )
      .slice(0, 5);
  }, [searchQuery, products]);

  const navItems = useMemo(() => {
    const items = [
      { label: t("nav.home"), route: "home" },
      { label: t("home.allDepartments"), route: "catalog" },
    ];
    (categories || []).forEach((cat) => {
      items.push({
        label: isRtl ? (cat.nameAr || cat.name) : (cat.nameEn || cat.name),
        route: "catalog",
        categoryId: cat.slug || cat.id,
        categoryObj: cat,
      });
    });
    return items;
  }, [categories, t, isRtl]);

  const mobileMenuItems = useMemo(() => {
    const items = [
      { icon: <Grid size={20} />, label: t("mobile.home"), route: "home" },
      { icon: <Grid size={20} />, label: t("home.allDepartments"), route: "catalog" },
    ];
    (categories || []).forEach((cat) => {
      items.push({
        icon: <Layers size={20} />,
        label: isRtl ? (cat.nameAr || cat.name) : (cat.nameEn || cat.name),
        route: "catalog",
        params: { category: cat.slug || cat.id },
      });
    });
    return items;
  }, [categories, t, isRtl]);

  return (
    <>
      {/* ─── Main Header ─── */}
      <header className={`sticky-header${isScrolled ? " scrolled" : ""}`}>
        <div className="header-container">
          {/* Hamburger (mobile only) */}
          <button
            className="mobile-menu-toggle-btn"
            aria-label={t("header.openMenu")}
            onClick={() => setIsMobileMenuOpen(true)}
          >
            <Menu size={24} />
          </button>

          {/* Logo */}
          <button
            className="brand-logo"
            onClick={() => navigateTo("home")}
            aria-label="Nova Store"
          >
            <img
              src="/Assets/logo-200w.webp"
              srcSet="/Assets/logo-200w.webp 200w, /Assets/no%20bg%20logo.webp 500w"
              sizes="(max-width: 768px) 130px, 145px"
              alt="Nova Store"
              className="brand-logo-img"
              width={145}
              height={145}
              loading="eager"
              decoding="async"
            />
          </button>

          {/* Desktop nav */}
          <nav className="main-nav desktop-only">
            {navItems.map((n) => {
              const hasSub = Boolean(n.categoryId);
              return (
                <div
                  key={n.label}
                  className="nav-item-wrapper"
                  onMouseEnter={() => hasSub && handleMouseEnterNav(n.categoryId)}
                  onMouseLeave={handleMouseLeaveNav}
                >
                  <button
                    className={`nav-link${
                      currentRoute === n.route &&
                      (!n.categoryId ||
                        activeHoverCategory?.id === n.categoryId ||
                        activeHoverCategory?.slug === n.categoryId)
                        ? " active"
                        : ""
                    }`}
                    onClick={() => {
                      if (n.categoryId) {
                        navigateTo("catalog", { category: n.categoryId });
                        setActiveHoverCategory(null);
                      } else {
                        navigateTo(n.route);
                        setActiveHoverCategory(null);
                      }
                    }}
                  >
                    {n.label}
                    {hasSub && <ChevronDown size={14} className="nav-chevron" />}
                  </button>
                </div>
              );
            })}
          </nav>

          {/* Search */}
          <div className="search-box-container desktop-only" ref={searchRef}>
            <Search className="search-icon" size={18} />
            <input
              className="search-input"
              type="text"
              placeholder={t("header.searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearchOpen(true);
              }}
              onFocus={() => setIsSearchOpen(true)}
            />

            <AnimatePresence>
              {isSearchOpen && searchMatches.length > 0 && (
                <motion.div
                  className="search-dropdown"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                >
                  {searchMatches.map((p) => (
                    <div
                      key={p.id}
                      className="search-item"
                      onClick={() => {
                        navigateTo("product", { id: p.id });
                        setIsSearchOpen(false);
                        setSearchQuery("");
                      }}
                    >
                      <img src={p.image} alt={p.name} />
                      <div>
                        <div className="search-item-name">{p.name}</div>
                        <div className="search-item-price">
                          ${p.price.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Actions */}
          <div className="header-actions">
            {/* Language toggle (Planet / Globe icon only) */}
            <button
              className="lang-toggle-btn"
              title={t("lang.label")}
              onClick={toggleLang}
              aria-label={t("lang.label")}
            >
              <Globe size={22} />
            </button>

            <button
              className="action-btn"
              title={t("header.cart")}
              onClick={() => setIsCartOpen(true)}
            >
              <ShoppingBag size={22} />
              {totalCartCount > 0 && (
                <motion.span
                  key={totalCartCount}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="badge-counter"
                >
                  {totalCartCount}
                </motion.span>
              )}
            </button>
          </div>
        </div>

        {/* ─── Impressive Subcategories Mega Menu Dropdown ─── */}
        <AnimatePresence>
          {activeHoverCategory && (
            <motion.div
              className="mega-menu-flyout"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
              onMouseEnter={handleMenuKeepOpen}
              onMouseLeave={handleMouseLeaveNav}
            >
              <div className="mega-menu-container">
                {/* Left Category Info Banner */}
                <div className="mega-menu-banner">
                  <div className="mega-banner-tag">{t("mega.explore")}</div>
                  <h3 className="mega-banner-title">
                    {isRtl
                      ? activeHoverCategory.nameAr || activeHoverCategory.name
                      : activeHoverCategory.nameEn || activeHoverCategory.name}
                  </h3>
                  <p className="mega-banner-desc">
                    {isRtl
                      ? `استكشف جميع منتجات ${activeHoverCategory.nameAr || activeHoverCategory.name}`
                      : `Explore premium hardware and accessories in ${activeHoverCategory.nameEn || activeHoverCategory.name}`}
                  </p>
                  <button
                    className="btn btn-primary btn-sm mega-banner-btn"
                    onClick={() => {
                      navigateTo("catalog", {
                        category: activeHoverCategory.slug || activeHoverCategory.id,
                      });
                      setActiveHoverCategory(null);
                    }}
                  >
                    {t("mega.viewAll", {
                      name: isRtl
                        ? activeHoverCategory.nameAr || activeHoverCategory.name
                        : activeHoverCategory.nameEn || activeHoverCategory.name,
                    })}{" "}
                    <ArrowRight size={14} className={isRtl ? "icon-flip-rtl" : ""} />
                  </button>
                </div>

                {/* Subcategories Grid with Images */}
                <div className="mega-menu-grid">
                  {(activeHoverCategory.subcategories || []).map((sub) => {
                    const repProduct = products.find(
                      (p) =>
                        p.subcategory === sub.slug ||
                        p.subcategory === sub.id ||
                        p.subcategoryId === sub.id ||
                        p.subcategoryNameEn === sub.nameEn
                    );
                    const subImg =
                      repProduct?.image ||
                      activeHoverCategory.image ||
                      "/Assets/Images/Laptop.webp";
                    const count = products.filter(
                      (p) =>
                        p.subcategory === sub.slug ||
                        p.subcategory === sub.id ||
                        p.subcategoryId === sub.id ||
                        p.subcategoryNameEn === sub.nameEn
                    ).length;

                    return (
                      <motion.div
                        key={sub.id}
                        whileHover={{ y: -4, scale: 1.02 }}
                        className="mega-subcat-card"
                        onClick={() => {
                          navigateTo("catalog", {
                            category: activeHoverCategory.slug || activeHoverCategory.id,
                            subcategory: sub.slug || sub.id,
                          });
                          setActiveHoverCategory(null);
                        }}
                      >
                        <div className="subcat-img-box">
                          <img
                            src={subImg}
                            alt={sub.nameEn || sub.name}
                            loading="lazy"
                          />
                        </div>
                        <div className="subcat-info-box">
                          <div className="subcat-title">
                            {isRtl
                              ? sub.nameAr || sub.nameEn || sub.name
                              : sub.nameEn || sub.name}
                          </div>
                          <div className="subcat-count">
                            {count} {t("mega.products")}
                          </div>
                        </div>
                        <div className="subcat-arrow">
                          <ArrowRight size={16} className={isRtl ? "icon-flip-rtl" : ""} />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ─── Mobile Drawer ─── */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            className="mobile-menu-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <motion.aside
              className="mobile-menu-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mobile-menu-header">
                <img
                  src="/Assets/logo-200w.webp"
                  alt="Nova Store"
                  width={145}
                  height={145}
                  style={{ height: 145, width: 145, objectFit: "contain" }}
                />
                <button
                  className="mobile-close-btn"
                  onClick={() => setIsMobileMenuOpen(false)}
                  aria-label={t("header.close")}
                >
                  <X size={24} />
                </button>
              </div>

              <nav className="mobile-menu-body">
                {mobileMenuItems.map((item) => (
                  <button
                    key={item.label}
                    className="mobile-menu-link"
                    onClick={() => {
                      navigateTo(item.route, item.params || {});
                      setIsMobileMenuOpen(false);
                    }}
                  >
                    {item.icon} {item.label}
                  </button>
                ))}
              </nav>

              <div className="mobile-menu-footer">
                <button
                  className="lang-toggle-btn mobile-lang-toggle"
                  onClick={toggleLang}
                >
                  <Globe size={16} />
                  {t("lang.switchTo")}
                </button>
              </div>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
