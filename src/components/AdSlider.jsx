import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { ArrowRight, Sparkles, Tag, Copy, Check } from "lucide-react";

export default function AdSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);
  const { navigateTo, addToast, promotionalAds = [] } = useStore();
  const { lang, t } = useLanguage();
  const isAr = lang === "ar";

  const slides = promotionalAds || [];
  const slideCount = slides.length;

  const nextSlide = useCallback(() => {
    if (slideCount === 0) return;
    setCurrentIndex((prev) => (prev + 1) % slideCount);
  }, [slideCount]);

  // Smooth auto-scroll interval with pause on hover
  useEffect(() => {
    if (isPaused || document.hidden || slideCount <= 1) return;
    const timer = setInterval(() => {
      nextSlide();
    }, 4500);

    const onVisibility = () => {
      if (document.hidden) clearInterval(timer);
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [isPaused, nextSlide, slideCount]);

  if (!slides || slides.length === 0) return null;

  const currentSlide = slides[currentIndex];

  const handleCardClick = (e, slide) => {
    if (e.target.closest(".ad-coupon-chip")) return;
    if (slide.link?.route) {
      navigateTo(slide.link.route, slide.link.params || {});
    } else {
      navigateTo("catalog");
    }
  };

  const handleCopyCode = (e, code) => {
    e.stopPropagation();
    if (!code) return;
    navigator.clipboard?.writeText(code);
    setCopiedCode(code);
    addToast(isAr ? `تم نسخ الكود ${code}!` : `Coupon ${code} copied!`, "success");
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Vertical (Up/Down) sliding transition
  const verticalSlideVariants = {
    initial: {
      y: 22,
      opacity: 0,
      filter: "blur(4px)",
    },
    animate: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: {
        y: { type: "spring", stiffness: 350, damping: 28 },
        opacity: { duration: 0.35, ease: "easeOut" },
        filter: { duration: 0.35 },
      },
    },
    exit: {
      y: -22,
      opacity: 0,
      filter: "blur(4px)",
      transition: {
        y: { type: "spring", stiffness: 350, damping: 28 },
        opacity: { duration: 0.25, ease: "easeIn" },
        filter: { duration: 0.25 },
      },
    },
  };

  return (
    <div
      className="ad-slider-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      role="region"
      aria-label="Promotional announcements"
    >
      <div className="section-container" style={{ paddingTop: "0.6rem", paddingBottom: "0.6rem" }}>
        <div className="ad-ticker-bar">
          <AnimatePresence initial={false} mode="wait">
            <motion.div
              key={currentSlide.id || currentIndex}
              variants={verticalSlideVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="ad-ticker-card"
              onClick={(e) => handleCardClick(e, currentSlide)}
            >
              {/* Background Glow Effect */}
              <div className="ad-ticker-glow" />

              {/* Left Badge & Promo Tag */}
              <div className="ad-ticker-badge-col">
                <span className="ad-ticker-pill">
                  <Sparkles size={13} className="sparkle-icon-spin" />
                  <span>{isAr ? currentSlide.badgeAr : currentSlide.badgeEn}</span>
                </span>

                {currentSlide.tag && (
                  <button
                    className={`ad-coupon-chip ${copiedCode === currentSlide.tag ? "copied" : ""}`}
                    onClick={(e) => handleCopyCode(e, currentSlide.tag)}
                    title={t("ad.copyCode")}
                    type="button"
                  >
                    <Tag size={12} />
                    <code>{currentSlide.tag}</code>
                    {copiedCode === currentSlide.tag ? (
                      <Check size={12} color="#10B981" />
                    ) : (
                      <Copy size={12} />
                    )}
                  </button>
                )}
              </div>

              {/* Center Content Text */}
              <div className="ad-ticker-content">
                <span className="ad-ticker-title">
                  {isAr ? currentSlide.titleAr : currentSlide.titleEn}
                </span>
                <span className="ad-ticker-subtitle">
                  {isAr ? currentSlide.subtitleAr : currentSlide.subtitleEn}
                </span>
              </div>

              {/* Right CTA Action */}
              <div className="ad-ticker-action">
                <motion.button
                  whileHover={{ scale: 1.04, x: isAr ? -3 : 3 }}
                  whileTap={{ scale: 0.96 }}
                  className="btn btn-primary btn-sm ad-ticker-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCardClick(e, currentSlide);
                  }}
                  type="button"
                >
                  <span>{isAr ? currentSlide.btnTextAr || "تسوق الآن" : currentSlide.btnTextEn || "Explore Now"}</span>
                  <ArrowRight size={14} className={isAr ? "icon-flip-rtl" : ""} />
                </motion.button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
