import React, { memo } from "react";
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

  /* extract key specs for pills */
  const firstSpecGroup = product.specs ? Object.values(product.specs)[0] : {};
  const specEntries = Object.entries(firstSpecGroup).slice(0, 2);

  /* stock status calculation */
  const isLowStock = product.stockCount !== undefined && product.stockCount <= 5 && product.stockCount > 0;
  const isOutOfStock = product.inStock === false || product.stockCount === 0;

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: "spring", stiffness: 350, damping: 24 }}
      className="product-card"
    >
      {/* Image Container */}
      <div
        className="product-card-top"
        onClick={() => navigateTo("product", { id: product.id })}
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
          src={product.image}
          alt={productName}
          loading="lazy"
          decoding="async"
          className="product-card-img"
          width={320}
          height={240}
        />
      </div>

      {/* Info Body */}
      <div className="product-card-body">
        <div className="product-card-meta">
          <span className="product-cat-name">
            {categoryName}
          </span>
          <div className="product-rating">
            <Star size={13} fill="#f59e0b" color="#f59e0b" className="rating-star-icon" />
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

        <h3
          className="product-card-title"
          onClick={() => navigateTo("product", { id: product.id })}
          title={productName}
        >
          {productName}
        </h3>

        <div className="product-spec-pills">
          {specEntries.map(([k, v]) => (
            <span key={k} className="spec-pill">
              <span className="spec-pill-key">{k}: </span>
              <span className="spec-pill-val font-mono">{v}</span>
            </span>
          ))}
        </div>

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
