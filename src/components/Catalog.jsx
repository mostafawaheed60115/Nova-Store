import React, { useMemo, useCallback, useState, useRef, useEffect } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { updateSeo } from "../utils/seoManager";
import ProductCard from "./ProductCard";
import {
  ChevronRight,
  RotateCcw,
  SearchX,
  SlidersHorizontal,
  X,
  Grid,
  Laptop,
  Monitor,
  Cpu,
  Headphones,
  ChevronDown,
  Filter,
  Check,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Star,
  ArrowUpDown,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../data/storeData";

const CATEGORY_ICONS = {
  all: <Grid size={18} />,
  laptops: <Laptop size={18} />,
  monitors: <Monitor size={18} />,
  "pc-bundles": <Cpu size={18} />,
  accessories: <Headphones size={18} />,
};

const SORT_OPTIONS = [
  { value: "relevance", labelKey: "catalog.sortRelevance", icon: Sparkles },
  { value: "price-asc", labelKey: "catalog.sortPriceAsc", icon: TrendingDown },
  { value: "price-desc", labelKey: "catalog.sortPriceDesc", icon: TrendingUp },
  { value: "rating", labelKey: "catalog.sortRating", icon: Star },
];

export default function Catalog() {
  const {
    activeCategory,
    setActiveCategory,
    activeSubcategory,
    setActiveSubcategory,
    searchQuery,
    setSearchQuery,
    maxPrice,
    setMaxPrice,
    sortBy,
    setSortBy,
    navigateTo,
    products = [],
    categories = [],
    isDbLoading,
  } = useStore();
  const { t, lang, isAr } = useLanguage();

  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState({
    category: false,
    subcategory: false,
    price: false,
    availability: false,
  });

  const sortDropdownRef = useRef(null);

  /* Close sort dropdown on click outside */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        sortDropdownRef.current &&
        !sortDropdownRef.current.contains(e.target)
      ) {
        setIsSortOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  /* Active sort option object */
  const activeSortOption = useMemo(
    () => SORT_OPTIONS.find((s) => s.value === sortBy) || SORT_OPTIONS[0],
    [sortBy]
  );

  /* ─── derived data ─── */
  const activeCatObj = useMemo(
    () => categories.find((c) => c.id === activeCategory || c.slug === activeCategory || c.id?.toString() === activeCategory?.toString()),
    [categories, activeCategory]
  );

  useEffect(() => {
    const catName = activeCatObj
      ? (isAr ? (activeCatObj.nameAr || activeCatObj.name_ar || activeCatObj.name) : (activeCatObj.nameEn || activeCatObj.name_en || activeCatObj.name))
      : (isAr ? "جميع الأجهزة والكتالوج" : "All Products & Catalog");

    const title = activeCatObj ? `${catName}` : (isAr ? "الكتالوج وجميع الأقسام" : "Catalog & All Departments");
    const desc = isAr
      ? `تسوق تشكيلة ${catName} الأصلية من نوفا ستور مع إمكانية التقسيط وضمان 24 شهر والدفع عند الاستلام في جميع محافظات مصر.`
      : `Explore the authentic ${catName} collection at Nova Store with official agent warranty and Cash on Delivery across Egypt.`;

    updateSeo({
      title,
      description: desc,
      path: activeCatObj ? `/catalog?category=${activeCatObj.slug || activeCatObj.id}` : "/catalog",
      lang,
      breadcrumbs: [
        { name: isAr ? "الرئيسية" : "Home", url: "/" },
        { name: catName, url: `/catalog${activeCatObj ? `?category=${activeCatObj.slug || activeCatObj.id}` : ""}` },
      ],
    });
  }, [activeCatObj, isAr, lang]);

  const filteredProducts = useMemo(() => {
    let list = products.filter((p) => {
      if (activeCategory !== "all") {
        const catMatch =
          p.category === activeCategory ||
          p.categoryId?.toString() === activeCategory?.toString() ||
          (activeCatObj && (p.category === activeCatObj.slug || p.categoryId === activeCatObj.id));
        if (!catMatch) return false;
      }
      if (activeSubcategory !== "all") {
        const subMatch =
          p.subcategory === activeSubcategory ||
          p.subcategoryId?.toString() === activeSubcategory?.toString();
        if (!subMatch) return false;
      }
      if (p.price > maxPrice) return false;
      if (inStockOnly && !p.inStock) return false;
      if (
        searchQuery &&
        !p.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.nameAr?.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
        return false;
      return true;
    });

    if (sortBy === "price-asc") list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (sortBy === "price-desc") list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (sortBy === "rating") list.sort((a, b) => (b.rating || 5) - (a.rating || 5));

    return list;
  }, [products, activeCategory, activeSubcategory, activeCatObj, maxPrice, inStockOnly, searchQuery, sortBy]);

  const hasActiveFilters =
    activeCategory !== "all" ||
    activeSubcategory !== "all" ||
    maxPrice < 150000 ||
    inStockOnly ||
    searchQuery !== "";

  const resetFilters = useCallback(() => {
    setActiveCategory("all");
    setActiveSubcategory("all");
    setMaxPrice(150000);
    setInStockOnly(false);
    setSearchQuery("");
  }, [setActiveCategory, setActiveSubcategory, setMaxPrice, setSearchQuery]);

  const toggleSection = (key) =>
    setCollapsedSections((prev) => ({ ...prev, [key]: !prev[key] }));

  /* ─── Filter Content UI Component ─── */
  const renderFilterContent = () => (
    <div className="remastered-filter-container">
      {/* Filter Header */}
      <div className="filter-header-bar">
        <div className="filter-header-title-group">
          <div className="filter-header-icon-box">
            <Filter size={16} />
          </div>
          <span className="filter-header-title">{t("filter.refine")}</span>
        </div>
        {hasActiveFilters && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="filter-reset-btn"
            onClick={resetFilters}
          >
            <RotateCcw size={12} className="reset-icon" /> {t("catalog.clearAll")}
          </motion.button>
        )}
      </div>

      {/* Accordion 1: Category */}
      <div className="filter-accordion-item">
        <button
          className="filter-accordion-header"
          onClick={() => toggleSection("category")}
        >
          <span>{t("filter.category")}</span>
          <ChevronDown
            size={16}
            className={`accordion-chevron ${collapsedSections.category ? "collapsed" : ""}`}
          />
        </button>

        <AnimatePresence initial={false}>
          {!collapsedSections.category && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="filter-accordion-body">
                <div
                  className={`filter-list-item ${activeCategory === "all" ? "active" : ""}`}
                  onClick={() => {
                    setActiveCategory("all");
                    setActiveSubcategory("all");
                  }}
                >
                  <div className="filter-item-label">
                    <span className="category-icon-box">{CATEGORY_ICONS.all}</span>
                    <span>{t("catalog.allGear")}</span>
                  </div>
                  <span className="filter-item-count">{products.length}</span>
                </div>

                {categories.map((c) => {
                  const cnt = products.filter((p) => p.category === c.id || p.category === c.slug || p.categoryId === c.id).length;
                  const isActive = activeCategory === c.id || activeCategory === c.slug;
                  return (
                    <div
                      key={c.id}
                      className={`filter-list-item ${isActive ? "active" : ""}`}
                      onClick={() => {
                        setActiveCategory(c.slug || c.id);
                        setActiveSubcategory("all");
                      }}
                    >
                      <div className="filter-item-label">
                        <span className="category-icon-box">{CATEGORY_ICONS[c.slug || c.id] || <Layers size={18} />}</span>
                        <span>{isAr ? (c.name_ar || c.nameAr || c.name) : (c.name_en || c.nameEn || c.name)}</span>
                      </div>
                      <span className="filter-item-count">{cnt}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Accordion 2: Subcategories (when category selected) */}
      {activeCatObj && (
        <div className="filter-accordion-item">
          <button
            className="filter-accordion-header"
            onClick={() => toggleSection("subcategory")}
          >
            <span>{t("filter.subcategory")}</span>
            <ChevronDown
              size={16}
              className={`accordion-chevron ${collapsedSections.subcategory ? "collapsed" : ""}`}
            />
          </button>

          <AnimatePresence initial={false}>
            {!collapsedSections.subcategory && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                style={{ overflow: "hidden" }}
              >
                <div className="filter-accordion-body">
                  <div className="subcat-chip-grid">
                    <button
                      className={`subcat-chip ${activeSubcategory === "all" ? "active" : ""}`}
                      onClick={() => setActiveSubcategory("all")}
                    >
                      <span>{t("filter.all", { name: activeCatObj.name })}</span>
                      <span className="chip-badge">{products.filter(p => p.category === activeCatObj.id || p.category === activeCatObj.slug || p.categoryId === activeCatObj.id).length}</span>
                    </button>

                    {(activeCatObj.subcategories || []).map((sub) => {
                      const cnt = products.filter(
                        (p) => p.subcategory === sub.id || p.subcategory === sub.slug || p.subcategoryId === sub.id
                      ).length;
                      const isActive = activeSubcategory === sub.id || activeSubcategory === sub.slug;
                      return (
                        <button
                          key={sub.id || sub.slug || i}
                          className={`subcat-chip ${isActive ? "active" : ""}`}
                          onClick={() => setActiveSubcategory(sub.slug || sub.id)}
                        >
                          <span>{isAr ? (sub.name_ar || sub.nameAr || sub.name) : (sub.name_en || sub.nameEn || sub.name)}</span>
                          <span className="chip-badge">{cnt}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Accordion 3: Price Range Slider */}
      <div className="filter-accordion-item">
        <button
          className="filter-accordion-header"
          onClick={() => toggleSection("price")}
        >
          <span>{t("filter.price")}</span>
          <span className="price-header-value">{formatCurrency(maxPrice, lang)}</span>
        </button>

        <AnimatePresence initial={false}>
          {!collapsedSections.price && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              style={{ overflow: "hidden" }}
            >
              <div className="filter-accordion-body">
                <div className="price-slider-box">
                  <input
                    type="range"
                    min="500"
                    max="150000"
                    step="500"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="custom-range-slider"
                    style={{
                      background: `linear-gradient(to right, var(--blue-bell) 0%, var(--blue-bell) ${((maxPrice - 500) / 149500) * 100}%, var(--alice-blue) ${((maxPrice - 500) / 149500) * 100}%, var(--alice-blue) 100%)`
                    }}
                  />
                  <div className="price-labels-row">
                    <span>{formatCurrency(500, lang)}</span>
                    <span>{formatCurrency(150000, lang)}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Stock Filter Toggle */}
      <button
        type="button"
        className="filter-stock-toggle"
        aria-pressed={inStockOnly}
        onClick={() => setInStockOnly(!inStockOnly)}
      >
        <div className={`checkbox-box ${inStockOnly ? "checked" : ""}`}>
          {inStockOnly && <Check size={12} strokeWidth={3} />}
        </div>
        <span className="stock-toggle-label">{t("filter.stock")}</span>
      </button>
    </div>
  );

  return (
    <div className="section-container">
      {/* Breadcrumbs */}
      <nav className="breadcrumbs">
        <button onClick={() => navigateTo("home")}>{t("catalog.breadcrumbHome")}</button>
        <ChevronRight size={14} />
        <span className="breadcrumb-current">{t("catalog.breadcrumbStore")}</span>
      </nav>

      {/* ─── Top Horizontal Department Bar (Peak Design Style) ─── */}
      <div className="top-category-tabs-bar">
        <motion.button
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.96 }}
          className={`top-cat-tab ${activeCategory === "all" ? "active" : ""}`}
          onClick={() => {
            setActiveCategory("all");
            setActiveSubcategory("all");
          }}
        >
          <span className="tab-icon">{CATEGORY_ICONS.all}</span>
          <span>{t("catalog.allGear")}</span>
        </motion.button>

        {categories.map((c) => (
          <motion.button
            key={c.id}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.96 }}
            className={`top-cat-tab ${activeCategory === c.id || activeCategory === c.slug ? "active" : ""}`}
            onClick={() => {
              setActiveCategory(c.slug || c.id);
              setActiveSubcategory("all");
            }}
          >
            <span className="tab-icon">{CATEGORY_ICONS[c.slug || c.id] || <Layers size={18} />}</span>
            <span>{isAr ? (c.name_ar || c.nameAr || c.name) : (c.name_en || c.nameEn || c.name)}</span>
          </motion.button>
        ))}
      </div>

      <div className="catalog-layout">
        {/* Desktop Sidebar */}
        <aside className="filter-sidebar desktop-only">
          {renderFilterContent()}
        </aside>

        {/* Main Content Area */}
        <main>
          {/* Mobile Filter Trigger Button */}
          <button
            className="mobile-filter-trigger-btn mobile-only"
            onClick={() => setIsMobileFilterOpen(true)}
          >
            <SlidersHorizontal size={18} /> {t("catalog.refineMobile")}
          </button>

          {/* Active Applied Filter Chips Bar */}
          <AnimatePresence>
            {hasActiveFilters && (
              <motion.div
                layout
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="active-filter-chips-bar"
              >
                <div className="chips-label-group">
                  <Filter size={13} className="chips-icon" />
                  <span className="chips-label">{t("catalog.appliedFilters")}</span>
                </div>
                <div className="chips-wrapper">
                  <AnimatePresence>
                    {activeCategory !== "all" && (
                      <motion.span
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="applied-chip"
                      >
                        <span>{t("catalog.chipCategory", { name: activeCatObj?.name || activeCategory })}</span>
                        <X
                          size={13}
                          className="chip-remove"
                          onClick={() => {
                            setActiveCategory("all");
                            setActiveSubcategory("all");
                          }}
                        />
                      </motion.span>
                    )}

                    {activeSubcategory !== "all" && (
                      <motion.span
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="applied-chip"
                      >
                        <span>{t("catalog.chipSubcategory", { name: activeSubcategory })}</span>
                        <X
                          size={13}
                          className="chip-remove"
                          onClick={() => setActiveSubcategory("all")}
                        />
                      </motion.span>
                    )}

                    {maxPrice < 150000 && (
                      <motion.span
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="applied-chip"
                      >
                        <span>{t("catalog.chipUnder", { price: formatCurrency(maxPrice, lang) })}</span>
                        <X
                          size={13}
                          className="chip-remove"
                          onClick={() => setMaxPrice(150000)}
                        />
                      </motion.span>
                    )}

                    {inStockOnly && (
                      <motion.span
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="applied-chip"
                      >
                        <span>{t("catalog.chipInStock")}</span>
                        <X
                          size={13}
                          className="chip-remove"
                          onClick={() => setInStockOnly(false)}
                        />
                      </motion.span>
                    )}

                    {searchQuery && (
                      <motion.span
                        layout
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 450, damping: 28 }}
                        className="applied-chip"
                      >
                        <span>{t("catalog.chipSearch", { q: searchQuery })}</span>
                        <X
                          size={13}
                          className="chip-remove"
                          onClick={() => setSearchQuery("")}
                        />
                      </motion.span>
                    )}
                  </AnimatePresence>

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="clear-all-chips-btn"
                    onClick={resetFilters}
                  >
                    {t("catalog.clearAll")}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ─── Remastered Toolbar (Count & Custom Animated Sort Dropdown) ─── */}
          <div className="catalog-toolbar">
            {/* Title & Product Count Section */}
            <div className="flex items-center gap-3">
              <div className="toolbar-icon-box">
                <Layers size={18} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <span style={{ color: '#76A4C4', fontWeight: 700, fontSize: '0.95rem' }}>
                  {t("catalog.showingPrefix")}
                </span>
                <motion.span
                  key={filteredProducts.length}
                  initial={{ scale: 0.7, y: -4, opacity: 0 }}
                  animate={{ scale: 1, y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                  className="toolbar-count-badge"
                >
                  {filteredProducts.length}
                </motion.span>
                <span style={{ color: '#162944', fontWeight: 800, fontSize: '0.95rem', letterSpacing: '-0.01em' }}>
                  {filteredProducts.length === 1 ? t("catalog.premiumProduct") : t("catalog.premiumProducts")}
                </span>
              </div>
            </div>

            {/* Sort Area with Animated Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', position: 'relative' }} ref={sortDropdownRef}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#76A4C4', userSelect: 'none' }}>
                <ArrowUpDown size={14} style={{ color: '#3399D4' }} />
                <span>{t("catalog.sortBy")}</span>
              </div>

              <div className="relative">
                <motion.button
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setIsSortOpen((prev) => !prev)}
                  className="sort-trigger-btn"
                  data-open={isSortOpen}
                  aria-haspopup="listbox"
                  aria-expanded={isSortOpen}
                >
                  <span style={{ width: '1.5rem', height: '1.5rem', borderRadius: '8px', background: '#EAF1F9', color: '#3399D4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    {activeSortOption?.icon && <activeSortOption.icon size={14} />}
                  </span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', letterSpacing: '-0.01em', color: '#162944' }}>
                    {t(activeSortOption?.labelKey)}
                  </span>
                  <motion.span
                    animate={{ rotate: isSortOpen ? 180 : 0 }}
                    transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                    style={{ color: '#76A4C4', marginLeft: '0.125rem' }}
                  >
                    <ChevronDown size={15} />
                  </motion.span>
                </motion.button>

                <AnimatePresence>
                  {isSortOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                      className="sort-dropdown-panel"
                      role="listbox"
                    >
                      {SORT_OPTIONS.map((opt) => {
                        const isSelected = sortBy === opt.value;
                        const Icon = opt.icon;
                        return (
                          <motion.button
                            key={opt.value}
                            type="button"
                            whileHover={{ x: 3 }}
                            whileTap={{ scale: 0.98 }}
                            className={`sort-option ${isSelected ? 'selected' : ''}`}
                            onClick={() => {
                              setSortBy(opt.value);
                              setIsSortOpen(false);
                            }}
                            role="option"
                            aria-selected={isSelected}
                          >
                            <span className={`sort-option-icon ${isSelected ? 'selected' : ''}`}>
                              <Icon size={14} />
                            </span>
                            <span className="flex-1">{t(opt.labelKey)}</span>
                            {isSelected && (
                              <motion.span
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 25 }}
                                style={{ width: '1.25rem', height: '1.25rem', borderRadius: '50%', background: '#3399D4', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}
                              >
                                <Check size={11} strokeWidth={3} />
                              </motion.span>
                            )}
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          {filteredProducts.length === 0 ? (
            <div className="empty-state">
              <SearchX size={52} color="var(--steel-blue)" />
              <h3>{t("catalog.emptyTitle")}</h3>
              <p>{t("catalog.emptyDesc")}</p>
              <button className="btn btn-primary" onClick={resetFilters}>
                <RotateCcw size={16} /> {t("catalog.resetFilters")}
              </button>
            </div>
          ) : (
            <div className="products-grid">
              {filteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile Filter Sheet */}
      <AnimatePresence>
        {isMobileFilterOpen && (
          <>
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileFilterOpen(false)}
            />
            <motion.div
              className="mobile-filter-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
            >
              <div className="drawer-header">
                <span className="drawer-title">{t("mobileFilter.title")}</span>
                <button
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="drawer-close-btn"
                  aria-label="Close filters"
                >
                  <X size={22} />
                </button>
              </div>

              <div style={{ padding: "1.5rem", overflowY: "auto", flex: 1 }}>
                {renderFilterContent()}
              </div>

              <div className="mobile-filter-footer">
                <button
                  className="btn btn-primary btn-full"
                  onClick={() => setIsMobileFilterOpen(false)}
                >
                  {t("mobileFilter.apply", { count: filteredProducts.length })}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
