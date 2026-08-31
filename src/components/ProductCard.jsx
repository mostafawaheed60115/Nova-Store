import React, { memo, useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { Star, ShoppingBag } from "lucide-react";

import { formatCurrency } from "../data/storeData";

function ProductCard({ product }) {
  const { addToCart, navigateTo } = useStore();
  const { t, lang, isRtl } = useLanguage();
  const productName = isRtl ? (product.nameAr || product.name) : (product.name || product.nameAr);
  const categoryName = isRtl
    ? (product.subcategoryNameAr || product.categoryNameAr || product.subcategory || product.category)
    : (product.subcategoryNameEn || product.categoryNameEn || product.subcategory || product.category);

  /* Gallery images (deduplicated) */
  const gallery = React.useMemo(() => {
    const imgs = product.images && product.images.length > 1
      ? product.images
      : [product.image];
    return [...new Set(imgs)];
  }, [product.images, product.image]);

  const hasMultipleImages = gallery.length > 1;
  const [imgIdx, setImgIdx] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef(null);

  /* Auto-cycle images on hover every 1.5 seconds */
  useEffect(() => {
    if (isHovered && hasMultipleImages) {
      intervalRef.current = setInterval(() => {
        setImgIdx((prev) => (prev + 1) % gallery.length);
      }, 1500);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered, hasMultipleImages, gallery.length]);

  /* Reset to primary image when not hovered */
  const handleMouseEnter = useCallback(() => setIsHovered(true), []);
  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    setImgIdx(0);
  }, []);

  /* extract key specs for pills */
  const firstSpecGroup =
    product?.specs && typeof product.specs === "object"
      ? Object.values(product.specs)[0] || {}
      : {};
  const specEntries =
    firstSpecGroup && typeof firstSpecGroup === "object"
      ? Object.entries(firstSpecGroup).slice(0, 2)
      : [];

  /* stock status calculation */
  const isLowStock = product.stockCount !== undefined && product.stockCount <= 5 && product.stockCount > 0;
  const isOutOfStock = product.inStock === false || product.stockCount === 0;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="product-card"
    >
      {/* Image Container */}
      <button
        type="button"
        className="product-card-top"
        onClick={() => navigateTo("product", { id: product.id })}
        aria-label={productName}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {product.badge && (
          <span
            className={`badge-tag ${
              product.badge.toLowerCase().includes("hot") ||
              product.badge.toLowerCase().includes("deal")
                ? "hot"
                : product.badge.toLowerCase().includes("best")
                ? "bestseller"
                : "pro"
            }`}
          >
            {product.badge}
          </span>
        )}

        <img
          src={gallery[imgIdx]}
          alt={productName}
          loading="lazy"
          decoding="async"
          className="product-card-img"
          width={320}
          height={240}
        />

        {/* Image gallery dots */}
        {hasMultipleImages && (
          <div
            className="card-gallery-dots"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
            }}
          >
            {gallery.map((_, i) => (
              <span
                key={i}
                className={`card-gallery-dot${i === imgIdx ? " active" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setImgIdx(i);
                }}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        )}

        {/* Image count badge */}
        {hasMultipleImages && (
          <span className="card-img-count">
            {imgIdx + 1}/{gallery.length}
          </span>
        )}
      </button>

      {/* Info Body */}
      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="product-cat-name">
            {categoryName}
          </span>
          <div className="product-rating">
            <Star size={13} fill="var(--color-warning)" color="var(--color-warning)" className="rating-star-icon" />
            <span className="rating-score">{product.rating}</span>
            <span className="rating-count">({product.reviewCount})</span>
          </div>
        </div>

        {/* Stock Status Badge */}
        <div className="product-stock-row">
          {isOutOfStock ? (
            <span className="stock-chip out-of-stock">
              <span className="stock-dot" />
              {t("stock.outOfStock")}
            </span>
          ) : isLowStock ? (
            <span className="stock-chip low-stock">
              <span className="stock-dot" />
              {t("stock.lowStock").replace("{count}", product.stockCount)}
            </span>
          ) : (
            <span className="stock-chip in-stock">
              <span className="stock-dot" />
              {t("stock.inStock")}
            </span>
          )}
        </div>

        <button
          type="button"
          className="product-card-title"
          onClick={() => navigateTo("product", { id: product.id })}
          aria-label={productName}
        >
          {productName}
        </button>

        {specEntries.length > 0 && (
          <div className="product-spec-pills">
            {specEntries.map(([k, v]) => (
              <span key={k} className="spec-pill">
                <span className="spec-pill-key">{k}: </span>
                <span className="spec-pill-val font-mono">{v}</span>
              </span>
            ))}
          </div>
        )}

        <div className="product-card-bottom">
          <div className="product-price-box">
            <div className="price-row">
              <span className="price-current">{formatCurrency(product.price, lang)}</span>
              {product.originalPrice && (
                <span className="price-original">
                  {formatCurrency(product.originalPrice, lang)}
                </span>
              )}
            </div>
          </div>

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
            className="btn btn-primary btn-sm add-cart-btn"
            onClick={() => addToCart(product.id)}
            disabled={isOutOfStock}
          >
            <ShoppingBag size={14} className="btn-cart-icon" />
            <span>{t("pdp.addToCartShort")}</span>
          </motion.button>
        </div>
      </div>
    </motion.article>
  );
}

export default memo(ProductCard);
