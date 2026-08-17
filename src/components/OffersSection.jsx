import React from "react";
import { motion } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { ArrowRight, Flame, ShoppingBag, Star } from "lucide-react";

import { formatCurrency } from "../data/storeData";

export default function OffersSection() {
  const { navigateTo, addToCart, products = [] } = useStore();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  // Filter products that have meaningful discounts (originalPrice > price) or badge is Deal
  const dealProducts = products
    .filter((p) => (p.originalPrice && p.originalPrice > p.price) || p.badge === "Deal" || p.discountPercent > 0)
    .sort((a, b) => {
      const savA = (a.originalPrice || a.price) - a.price;
      const savB = (b.originalPrice || b.price) - b.price;
      return savB - savA;
    })
    .slice(0, 4);

  if (dealProducts.length === 0) return null;

  return (
    <section className="section-container offers-section">
      <div className="section-header">
        <div>
          <div className="offers-headline-badge">
            <Flame size={16} color="var(--light-coral)" />
            <span>{t("home.limitedDeal")}</span>
          </div>
          <h2 className="section-title">{t("home.offers")}</h2>
          <p className="section-subtitle">{t("home.offersSub")}</p>
        </div>
        <button
          className="btn btn-outline btn-sm desktop-only"
          onClick={() => navigateTo("catalog")}
          type="button"
        >
          {t("home.viewAllOffers")} <ArrowRight size={14} className={isAr ? "icon-flip-rtl" : ""} />
        </button>
      </div>

      <div className="offers-grid">
        {dealProducts.map((product, i) => {
          const originalPrice = product.originalPrice && product.originalPrice > product.price ? product.originalPrice : null;
          const savings = originalPrice ? Math.max(0, originalPrice - product.price) : 0;
          const discountPercent = originalPrice ? Math.round((savings / originalPrice) * 100) : 0;

          return (
            <motion.div
              key={product.id}
              className="deal-card"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              whileHover={{ y: -6 }}
            >
              {/* Card Top / Image Area */}
              <div
                className="deal-card-top"
                onClick={() => navigateTo("product", { id: product.id })}
              >
                {savings > 0 && (
                  <div className="deal-discount-pill">
                    <Flame size={12} />
                    <span>{isAr ? `وفّر ${formatCurrency(savings, lang)}` : `Save ${formatCurrency(savings, lang)}`}</span>
                    <span className="deal-discount-percent">(-{discountPercent}%)</span>
                  </div>
                )}

                <img
                  src={product.image}
                  alt={product.name}
                  loading="lazy"
                  decoding="async"
                  className="deal-card-img"
                />
              </div>

              {/* Card Body */}
              <div className="deal-card-body">
                <div className="deal-card-meta">
                  <span className="deal-cat-name">
                    {product.subcategory || product.category}
                  </span>
                  <div className="deal-rating">
                    <Star size={13} fill="var(--amber-gold)" color="var(--amber-gold)" />
                    <span>{product.rating || "4.9"}</span>
                  </div>
                </div>

                <h3
                  className="deal-card-title"
                  onClick={() => navigateTo("product", { id: product.id })}
                >
                  {product.name}
                </h3>

                <p className="deal-card-desc">{product.shortDesc || product.description}</p>

                {/* Pricing & CTA */}
                <div className="deal-card-footer">
                  <div className="deal-price-col">
                    {originalPrice > product.price && (
                      <div className="deal-original-price">{formatCurrency(originalPrice, lang)}</div>
                    )}
                    <div className="deal-current-price">{formatCurrency(product.price || 0, lang)}</div>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="btn btn-primary btn-sm deal-add-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      addToCart(product.id, 1);
                    }}
                    type="button"
                    aria-label={`Add ${product.name} to cart`}
                  >
                    <ShoppingBag size={15} />
                    <span>{t("pdp.addToCartShort")}</span>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
