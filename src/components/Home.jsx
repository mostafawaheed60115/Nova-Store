import React, { useState, useEffect, useRef } from "react";
import AdSlider from "./AdSlider";
import Hero from "./Hero";
import OffersSection from "./OffersSection";
import ProductCard from "./ProductCard";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import {
  ArrowRight,
  ShieldCheck,
  Truck,
  RefreshCw,
  Zap,
  ChevronLeft,
  ChevronRight,
  Layers,
} from "lucide-react";
import { motion } from "framer-motion";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  }),
};

export default function Home() {
  const { navigateTo, products = [], categories = [] } = useStore();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const scrollRef = useRef(null);
  const [isHovered, setIsHovered] = useState(false);

  const trustItems = [
    {
      icon: <ShieldCheck size={24} />,
      title: t("trust.lifetime"),
      desc: t("trust.lifetimeDesc"),
    },
    {
      icon: <Truck size={24} />,
      title: t("trust.shipping"),
      desc: t("trust.shippingDesc"),
    },
    {
      icon: <RefreshCw size={24} />,
      title: t("trust.returns"),
      desc: t("trust.returnsDesc"),
    },
    {
      icon: <Zap size={24} />,
      title: t("trust.support"),
      desc: t("trust.supportDesc"),
    },
  ];

  const bestSellers = products
    .filter((p) => p.isBestSeller || p.badge === "Bestseller")
    .slice(0, 4);

  const displayProducts = bestSellers.length > 0 ? bestSellers : products.slice(0, 4);

  // Automatic gentle continuous sliding for categories
  useEffect(() => {
    if (isHovered || !scrollRef.current || categories.length === 0) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        const maxScroll = scrollWidth - clientWidth;
        const step = isAr ? -280 : 280;

        if (isAr) {
          if (Math.abs(scrollLeft) >= maxScroll - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            scrollRef.current.scrollBy({ left: step, behavior: "smooth" });
          }
        } else {
          if (scrollLeft >= maxScroll - 10) {
            scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
          } else {
            scrollRef.current.scrollBy({ left: step, behavior: "smooth" });
          }
        }
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [isHovered, categories.length, isAr]);

  const scrollPrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: isAr ? 300 : -300, behavior: "smooth" });
    }
  };

  const scrollNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: isAr ? -300 : 300, behavior: "smooth" });
    }
  };

  return (
    <>
      {/* 1. CMS-Controlled Promotional Ad Banner Segment (Vertical Slide) */}
      <AdSlider />

      {/* 2. Hero Section */}
      <Hero />

      {/* 3. Offers & Hot Deals Section (After Hero) */}
      <OffersSection />

      {/* 4. Best Sellers Section */}
      {displayProducts.length > 0 && (
        <section className="section-container bestsellers-section">
          <div className="section-header">
            <div>
              <h2 className="section-title">{t("home.bestsellers")}</h2>
              <p className="section-subtitle">{t("home.bestsellersSub")}</p>
            </div>
            <button
              className="btn btn-outline btn-sm desktop-only"
              onClick={() => navigateTo("catalog")}
              type="button"
            >
              {t("home.viewAll")} <ArrowRight size={14} className={isAr ? "icon-flip-rtl" : ""} />
            </button>
          </div>

          <div className="products-grid">
            {displayProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}

      {/* 5. Automatic Sliding Categories Showcase (Pills removed as requested) */}
      {categories.length > 0 && (
        <section
          className="section-container category-showcase-section"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          <div className="section-header">
            <div>
              <h2 className="section-title">{t("home.shopByCategory")}</h2>
              <p className="section-subtitle">{t("home.shopByCategorySub")}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <div className="category-slider-arrows desktop-only" style={{ display: "flex", alignItems: "center", gap: "0.4rem", direction: "ltr" }}>
                <button
                  type="button"
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
                    }
                  }}
                  className="cat-arrow-btn"
                  aria-label="Scroll left"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
                    }
                  }}
                  className="cat-arrow-btn"
                  aria-label="Scroll right"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
              <button
                className="btn btn-outline btn-sm desktop-only"
                onClick={() => navigateTo("catalog")}
                type="button"
              >
                {t("home.exploreCatalog")} <ArrowRight size={14} className={isAr ? "icon-flip-rtl" : ""} />
              </button>
            </div>
          </div>

          {/* Auto-sliding category card strip */}
          <div className="auto-category-slider" ref={scrollRef}>
            <div className="auto-category-track">
              {categories.map((cat, i) => {
                const count = products.filter(
                  (p) => p.category === cat.id || p.category === cat.slug || p.categoryId === cat.id
                ).length;

                return (
                  <motion.div
                    key={cat.id}
                    className="auto-category-card"
                    custom={i}
                    initial="hidden"
                    whileInView="visible"
                    viewport={{ once: true, margin: "-40px" }}
                    variants={fadeUp}
                    whileHover={{ y: -8, scale: 1.02 }}
                    onClick={() => navigateTo("catalog", { category: cat.slug || cat.id })}
                  >
                    <div
                      className="category-card-bg"
                      style={{ backgroundImage: `url('${cat.image || "/Assets/Images/Laptop.webp"}')` }}
                    />
                    <div className="category-card-overlay" />
                    <div className="category-card-content">
                      <div className="category-card-badge">
                        <Layers size={14} />
                        <span>Department</span>
                      </div>
                      <h3 className="category-card-title">{cat.name}</h3>
                      <div className="category-card-count">
                        {count} {t("home.products")} <ArrowRight size={14} className={isAr ? "icon-flip-rtl" : ""} />
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* 6. Trust Bar */}
      <section className="trust-bar">
        <div className="trust-grid">
          {trustItems.map((item) => (
            <div key={item.title} className="trust-item">
              <div className="trust-icon">{item.icon}</div>
              <div>
                <div className="trust-title">{item.title}</div>
                <div className="trust-desc">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}