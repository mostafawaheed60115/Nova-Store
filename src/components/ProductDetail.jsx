import React, { useState, useEffect, useMemo, useRef } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../data/storeData";
import { updateSeo } from "../utils/seoManager";
import {
  ChevronRight,
  ShoppingBag,
  ChevronDown,
  HelpCircle,
  ShieldCheck,
  Truck,
  RotateCcw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductDetail() {
  const { pdpProductId, addToCart, navigateTo, products = [], isDbLoading } = useStore();
  const { t, lang, isRtl } = useLanguage();

  const product = useMemo(() => {
    if (!products || products.length === 0) return null;
    if (pdpProductId) {
      const found = products.find(
        (p) =>
          p.id?.toString() === pdpProductId.toString() ||
          p.dbId?.toString() === pdpProductId.toString()
      );
      if (found) return found;
    }
    return products[0] || null;
  }, [products, pdpProductId]);

  const [activeImg, setActiveImg] = useState(
    product?.image || product?.gallery?.[0] || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80"
  );
  const [expandedSections, setExpandedSections] = useState({});
  const [showStickyBar, setShowStickyBar] = useState(false);
  const ctaRef = useRef(null);

  /* Reset view state whenever the displayed product changes & Update SEO */
  useEffect(() => {
    if (!product) return;
    const initialImg = product.image ||
      product.gallery?.[0] ||
      "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80";
    setActiveImg(initialImg);
    setExpandedSections({});

    const pName = isRtl ? (product.nameAr || product.name) : (product.name || product.nameAr);
    const pDesc = isRtl ? (product.descriptionAr || product.description) : (product.description || product.descriptionAr);
    const cName = isRtl ? (product.categoryNameAr || product.category) : (product.categoryNameEn || product.category);

    updateSeo({
      title: pName,
      description: pDesc,
      path: `/product/${product.id}`,
      image: initialImg,
      type: "product",
      lang,
      product,
      breadcrumbs: [
        { name: isRtl ? "الرئيسية" : "Home", url: "/" },
        { name: cName || (isRtl ? "الكتالوج" : "Catalog"), url: `/catalog?category=${encodeURIComponent(product.category || "all")}` },
        { name: pName, url: `/product/${product.id}` },
      ],
    });
  }, [product, lang, isRtl]);

  /* Track scroll for Desktop Sticky Buy Bar */
  useEffect(() => {
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          if (ctaRef.current) {
            const rect = ctaRef.current.getBoundingClientRect();
            setShowStickyBar(rect.bottom < 0);
          }
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleSection = (sec) =>
    setExpandedSections((p) => ({ ...p, [sec]: !p[sec] }));

  if (!product) {
    return (
      <div className="section-container" style={{ padding: "6rem 1rem", textAlign: "center" }}>
        {isDbLoading ? (
          <div className="route-fallback-spinner" style={{ margin: "0 auto" }} />
        ) : (
          <>
            <h3 style={{ fontSize: "1.5rem", fontWeight: 800, color: "var(--prussian-blue)" }}>
              {isRtl ? "المنتج غير موجود أو تم نقله" : "Product Not Found"}
            </h3>
            <p style={{ color: "var(--steel-blue)", marginTop: "0.5rem" }}>
              {isRtl ? "يمكنك استكشاف التشكيلة الكاملة من الكتالوج" : "Explore our full hardware inventory in the catalog"}
            </p>
            <button className="btn btn-primary" onClick={() => navigateTo("catalog")} style={{ marginTop: "1.25rem" }}>
              {isRtl ? "تصفح الكتالوج" : "Browse Full Catalog"}
            </button>
          </>
        )}
      </div>
    );
  }

  const currentPrice = Number(product.price || product.sale_price || 0);
  const productName = isRtl ? (product.nameAr || product.name) : (product.name || product.nameAr);
  const productDesc = isRtl ? (product.descriptionAr || product.description) : (product.description || product.descriptionAr);
  const categoryName = isRtl ? (product.categoryNameAr || product.category) : (product.categoryNameEn || product.category);
  const subcategoryName = isRtl ? (product.subcategoryNameAr || product.subcategory) : (product.subcategoryNameEn || product.subcategory);

  return (
    <div className="section-container" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      {/* Breadcrumbs */}
      <nav className="breadcrumbs" style={{ marginBottom: "1.5rem" }}>
        <button onClick={() => navigateTo("home")}>{t("catalog.breadcrumbHome")}</button>
        <ChevronRight size={14} />
        <button onClick={() => navigateTo("catalog", { category: product.category })}>
          {categoryName}
        </button>
        {subcategoryName && (
          <>
            <ChevronRight size={14} />
            <button onClick={() => navigateTo("catalog", { category: product.category, subcategory: product.subcategory })}>
              {subcategoryName}
            </button>
          </>
        )}
        <ChevronRight size={14} />
        <span className="breadcrumb-current">{productName}</span>
      </nav>

      <div className="pdp-layout">
        {/* ─── Gallery ─── */}
        <div className="pdp-gallery-container">
          <div className="pdp-main-image-box">
            <motion.img
              key={activeImg}
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              src={activeImg}
              alt={productName}
              className="pdp-main-img"
            />
          </div>
          {product.gallery && product.gallery.length > 1 && (
            <div className="pdp-thumbnails">
              {product.gallery.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`View ${i + 1}`}
                  className={`pdp-thumb${activeImg === url ? " active" : ""}`}
                  onClick={() => setActiveImg(url)}
                />
              ))}
            </div>
          )}
        </div>

        {/* ─── Info ─── */}
        <div className="pdp-info-box">
          <div>
            {product.badge && (
              <span className="pdp-badge">{product.badge}</span>
            )}
            <h1 className="pdp-title">{productName}</h1>
            <p className="pdp-description">{productDesc}</p>
          </div>

          {/* Price */}
          <div className="pdp-price-row">
            <span className="pdp-price-main">
              {formatCurrency(currentPrice, lang)}
            </span>
            {product.originalPrice && product.originalPrice > currentPrice && (
              <span className="pdp-price-original">
                {formatCurrency(product.originalPrice, lang)}
              </span>
            )}
            <span className="pdp-price-installments">
              {t("common.orMonthly").replace("{amount}", Math.ceil(currentPrice / 12).toLocaleString())}
            </span>
          </div>

          {/* CTA & Cart Action */}
          <div className="pdp-cta-row" ref={ctaRef}>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              className="btn btn-primary pdp-add-btn"
              onClick={() => addToCart(product.id, 1)}
            >
              <ShoppingBag size={20} /> {t("pdp.addToCart")}
            </motion.button>
          </div>

          {/* Trust Value Badges */}
          <div className="pdp-trust-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", marginTop: "1.25rem", padding: "1rem", background: "#F8FAFC", borderRadius: "12px", border: "1px solid #E2E8F0" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={20} color="#059669" />
              <div>
                <strong style={{ display: "block", fontSize: "0.775rem", color: "#1E293B" }}>{isRtl ? "ضمان أصلي 24 شهر" : "2-Year Warranty"}</strong>
                <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{isRtl ? "استبدال وصيانة فورية" : "Official Agent"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Truck size={20} color="#2563EB" />
              <div>
                <strong style={{ display: "block", fontSize: "0.775rem", color: "#1E293B" }}>{isRtl ? "شحن آمن وسريع" : "Fast Delivery"}</strong>
                <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{isRtl ? "خيارات توصيل مرنة" : "Flexible delivery options"}</span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <RotateCcw size={20} color="#7C3AED" />
              <div>
                <strong style={{ display: "block", fontSize: "0.775rem", color: "#1E293B" }}>{isRtl ? "استرجاع خلال 14 يوم" : "14-Day Returns"}</strong>
                <span style={{ fontSize: "0.7rem", color: "#64748B" }}>{isRtl ? "سهل وبدون تعقيد" : "Hassle-Free"}</span>
              </div>
            </div>
          </div>

          {/* Plain-English Spec Guide Banner */}
          <div className="spec-translator-guide-banner" style={{ background: "var(--alice-blue)", borderRadius: "var(--border-radius)", padding: "0.75rem 1rem", marginTop: "1.5rem", borderLeft: "4px solid var(--light-coral)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", fontWeight: 700, fontSize: "0.875rem", color: "var(--prussian-blue)" }}>
              <HelpCircle size={16} style={{ color: "var(--light-coral)" }} />
              {t("pdp.specTranslatorTitle")}
            </div>
            <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.775rem", color: "var(--steel-blue)" }}>
              {t("pdp.specTranslatorBadge")}
            </p>
          </div>

          {/* Specifications Table */}
          <div className="spec-accordion" style={{ marginTop: "1.5rem" }}>
            <div className="spec-accordion-item">
              <button
                className="spec-accordion-header"
                onClick={() => toggleSection("generalSpecs")}
                aria-expanded={expandedSections.generalSpecs !== false}
              >
                <span>{isRtl ? "المواصفات التقنية الكاملة" : "Complete Technical Specifications"}</span>
                <ChevronDown
                  size={18}
                  style={{
                    transform: expandedSections.generalSpecs !== false ? "rotate(180deg)" : "rotate(0)",
                    transition: "transform 0.25s ease",
                  }}
                />
              </button>
              <AnimatePresence initial={false}>
                {expandedSections.generalSpecs !== false && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div className="spec-accordion-body">
                      <table className="spec-table">
                        <tbody>
                          <tr>
                            <td className="spec-key">{isRtl ? "الفئة والقسم" : "Department Category"}</td>
                            <td className="spec-val spec-mono">{categoryName} → {subcategoryName}</td>
                          </tr>
                          <tr>
                            <td className="spec-key">{isRtl ? "حالة الجهاز" : "Hardware Condition"}</td>
                            <td className="spec-val spec-mono">{isRtl ? "جديد أصلي بالضمان" : "Brand New (Factory Sealed)"}</td>
                          </tr>
                          <tr>
                            <td className="spec-key">{isRtl ? "المخزون والتوفر" : "Stock Status"}</td>
                            <td className="spec-val spec-mono">{product.inStock ? (isRtl ? `متوفر (${product.stockCount} قطعة)` : `In Stock (${product.stockCount} units)`) : (isRtl ? "غير متوفر حالياً" : "Out of Stock")}</td>
                          </tr>
                          {product.specs && typeof product.specs === "object" && Object.entries(product.specs).map(([k, v]) => (
                            <tr key={k}>
                              <td className="spec-key">{k}</td>
                              <td className="spec-val spec-mono">{typeof v === "object" ? JSON.stringify(v) : v.toString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Sticky Buy Bar */}
      <div className={`pdp-sticky-bar desktop-only ${showStickyBar ? "visible" : ""}`}>
        <div className="sticky-bar-left" style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <img src={activeImg} alt={productName} style={{ width: "42px", height: "42px", objectFit: "contain", borderRadius: "4px", background: "#fff" }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--prussian-blue)" }}>{productName}</div>
          </div>
        </div>
        <div className="sticky-bar-right" style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontWeight: 700, fontSize: "1.1rem", color: "var(--prussian-blue)" }}>{formatCurrency(currentPrice, lang)}</div>
            <div style={{ fontSize: "0.75rem", color: "var(--steel-blue)" }}>
              {t("common.orMonthly").replace("{amount}", Math.ceil(currentPrice / 12).toLocaleString())}
            </div>
          </div>
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.96 }}
            className="btn btn-primary btn-sm"
            onClick={() => addToCart(product.id, 1)}
          >
            <ShoppingBag size={16} /> {t("pdp.addToCartShort")}
          </motion.button>
        </div>
      </div>

      {/* Mobile sticky bar */}
      <div className="mobile-sticky-buy-bar mobile-only">
        <div className="mobile-buy-info">
          <span className="mobile-buy-name">{productName}</span>
          <span className="mobile-buy-price">
            {formatCurrency(currentPrice, lang)}
          </span>
        </div>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="btn btn-primary btn-sm"
          onClick={() => addToCart(product.id, 1)}
        >
          <ShoppingBag size={16} /> {t("pdp.addToCartShort")}
        </motion.button>
      </div>
    </div>
  );
}
