import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const HERO_FALLBACK_SLIDES = [
  {
    tag: "Best-Selling Pro Laptop",
    tagAr: "لابتوب احترافي الأكثر مبيعاً",
    title: "High-Performance Laptop for Heavy Workloads & Gaming",
    titleAr: "لابتوب فائق الأداء للمهام الثقيلة والألعاب التنافسية",
    subtitle: "Smooth 240Hz screen, all-day power, and liquid cooling. Perfect for creators, developers, and competitive gamers.",
    subtitleAr: "شاشة فائقة السلاسة 240Hz، طاقة تدوم طوال اليوم، ونظام تبريد متطور للمبدعين والمبرمجين واللاعبين.",
    image: "/Assets/Images/heros/hero1.webp",
    primaryCtaText: "Explore Now",
    primaryCtaTextAr: "استكشف الآن",
    primaryCtaLink: "/catalog",
    secondaryCtaText: "Shop All Gear",
    secondaryCtaTextAr: "تسوق كل الأجهزة",
    secondaryCtaLink: "/catalog",
  },
  {
    tag: "UltraWide Curved Workspace",
    tagAr: "مساحة عمل منحنية عريضة",
    title: "See Everything At Once with UltraWide Clarity",
    titleAr: "شاهد كل شيء بوضوح ودقة مع شاشات UltraWide فائقة العرض",
    subtitle: "Built-in USB-C dock connects your entire setup with a single cable. Crisp colors for video editing and multitasking.",
    subtitleAr: "منفذ USB-C مدمج يوصل كل أجهزتك بكابل واحد. دقة ألوان استثنائية للمونتاج وتعدد المهام.",
    image: "/Assets/Images/heros/hero2.webp",
    primaryCtaText: "Explore Now",
    primaryCtaTextAr: "استكشف الآن",
    primaryCtaLink: "/catalog",
    secondaryCtaText: "Shop All Gear",
    secondaryCtaTextAr: "تسوق كل الأجهزة",
    secondaryCtaLink: "/catalog",
  },
];

export default function Hero() {
  const [[page, direction], setPage] = useState([0, 0]);
  const { navigateTo, heroSlides } = useStore();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";
  const nextIndexRef = useRef(0);

  const slides = heroSlides && heroSlides.length > 0 ? heroSlides : HERO_FALLBACK_SLIDES;
  const index = Math.abs(page % slides.length);

  const paginate = useCallback((newDirection) => {
    setPage(([prevPage]) => [prevPage + newDirection, newDirection]);
  }, []);

  const next = useCallback(() => paginate(1), [paginate]);
  const prev = useCallback(() => paginate(-1), [paginate]);

  /* Preload next slide image during idle time for seamless transitions */
  useEffect(() => {
    const nextIdx = (index + 1) % slides.length;
    nextIndexRef.current = nextIdx;
    const nextSlideImg = slides[nextIdx]?.image || slides[nextIdx]?.desktop_image;
    if (!nextSlideImg) return;

    const timer = setTimeout(() => {
      const img = new Image();
      img.src = nextSlideImg;
    }, 2000);

    return () => clearTimeout(timer);
  }, [index, slides]);

  /* Auto-advance timer */
  useEffect(() => {
    if (document.hidden || slides.length <= 1) return;
    const timer = setInterval(() => {
      paginate(1);
    }, 4500);

    const onVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(timer);
      }
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [paginate, page, slides.length]);

  const slide = slides[index] || slides[0];

  const handleCtaClick = (linkStr) => {
    if (!linkStr) {
      navigateTo("catalog");
      return;
    }
    const cleanLink = linkStr.trim();
    if (cleanLink.startsWith("product:") || cleanLink.startsWith("/product/")) {
      const id = cleanLink.replace("product:", "").replace("/product/", "");
      navigateTo("product", { id });
    } else if (cleanLink.startsWith("category:") || cleanLink.startsWith("/catalog?category=")) {
      const category = cleanLink.replace("category:", "").replace("/catalog?category=", "");
      navigateTo("catalog", { category });
    } else {
      navigateTo("catalog");
    }
  };

  const slideVariants = {
    enter: (dir) => ({
      x: dir > 0 ? "100%" : "-100%",
      opacity: 0,
      zIndex: 1,
    }),
    center: {
      x: 0,
      opacity: 1,
      zIndex: 2,
      transition: {
        x: { type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.45 },
        opacity: { duration: 0.3 },
      },
    },
    exit: (dir) => ({
      x: dir > 0 ? "-100%" : "100%",
      opacity: 0,
      zIndex: 0,
      transition: {
        x: { type: "tween", ease: [0.25, 1, 0.5, 1], duration: 0.45 },
        opacity: { duration: 0.3 },
      },
    }),
  };

  const currentTag = isAr ? (slide.tagAr || slide.tag) : (slide.tag || slide.tagAr);
  const currentTitle = isAr ? (slide.titleAr || slide.title) : (slide.title || slide.titleAr);
  const currentSubtitle = isAr ? (slide.subtitleAr || slide.subtitle) : (slide.subtitle || slide.subtitleAr);
  const rawImage = slide.image || slide.desktop_image || "/Assets/Images/heros/hero1.webp";
  const currentImage = typeof rawImage === "string" ? rawImage.replace(/\.jpeg$/i, ".webp") : "/Assets/Images/heros/hero1.webp";

  // Build responsive srcset for local hero images
  const getHeroSrcSet = (imgSrc) => {
    if (!imgSrc || typeof imgSrc !== "string") return undefined;
    if (imgSrc.includes("hero1")) {
      return "/Assets/Images/heros/hero1-480w.webp 480w, /Assets/Images/heros/hero1-768w.webp 768w, /Assets/Images/heros/hero1-1200w.webp 1200w, /Assets/Images/heros/hero1.webp 1600w";
    }
    if (imgSrc.includes("hero2")) {
      return "/Assets/Images/heros/hero2-480w.webp 480w, /Assets/Images/heros/hero2-768w.webp 768w, /Assets/Images/heros/hero2-1200w.webp 1200w, /Assets/Images/heros/hero2.webp 1600w";
    }
    return undefined;
  };
  const heroSrcSet = getHeroSrcSet(currentImage);

  const currentPrimaryText = isAr
    ? (slide.primaryCtaTextAr || slide.primaryCtaText || t("hero.explore"))
    : (slide.primaryCtaText || slide.primaryCtaTextAr || t("hero.explore"));
  const currentSecondaryText = isAr
    ? (slide.secondaryCtaTextAr || slide.secondaryCtaText || t("hero.shopAll"))
    : (slide.secondaryCtaText || slide.secondaryCtaTextAr || t("hero.shopAll"));

  return (
    <section className="hero-section" style={{ position: "relative" }}>
      <AnimatePresence initial={false} custom={direction} mode="popLayout">
        <motion.div
          key={page}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={(e, { offset, velocity }) => {
            const swipe = Math.abs(offset.x) * velocity.x;
            if (swipe < -10000 || offset.x < -100) {
              paginate(1);
            } else if (swipe > 10000 || offset.x > 100) {
              paginate(-1);
            }
          }}
          className="hero-slide"
          style={{ cursor: "grab" }}
          whileTap={{ cursor: "grabbing" }}
        >
          {/* Full-bleed background image with responsive srcset and explicit dimensions */}
          <img
            src={currentImage}
            srcSet={heroSrcSet}
            sizes="(max-width: 480px) 480px, (max-width: 768px) 768px, (max-width: 1200px) 1200px, 100vw"
            alt={currentTitle}
            className="hero-bg-img"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            draggable={false}
            width={1342}
            height={480}
          />

          {/* Gradient Overlay */}
          <div className="hero-overlay" />

          {/* Floating Content from Supabase backend */}
          <div className="hero-content">
            {currentTag && (
              <motion.span
                className="hero-pill-tag"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                {currentTag}
              </motion.span>
            )}

            <motion.h1
              className="hero-title"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.45 }}
            >
              {currentTitle}
            </motion.h1>

            <motion.p
              className="hero-subtitle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.45 }}
            >
              {currentSubtitle}
            </motion.p>

            <motion.div
              className="hero-actions"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
            >
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="btn btn-primary hero-cta"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCtaClick(slide.primaryCtaLink || slide.primary_cta_link);
                }}
                type="button"
              >
                {currentPrimaryText} <ArrowRight size={18} className={isAr ? "icon-flip-rtl" : ""} />
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.04, y: -2 }}
                whileTap={{ scale: 0.96 }}
                className="btn btn-ghost"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCtaClick(slide.secondaryCtaLink || slide.secondary_cta_link || "/catalog");
                }}
                type="button"
              >
                {currentSecondaryText}
              </motion.button>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Hero navigation arrows */}
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="hero-arrow hero-arrow-left"
        onClick={isAr ? next : prev}
        aria-label={isAr ? "Next slide" : "Previous slide"}
        type="button"
      >
        <ChevronLeft size={24} />
      </motion.button>
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className="hero-arrow hero-arrow-right"
        onClick={isAr ? prev : next}
        aria-label={isAr ? "Previous slide" : "Next slide"}
        type="button"
      >
        <ChevronRight size={24} />
      </motion.button>

      {/* Hero dots & slide timer loading circle */}
      <div className="hero-controls-wrapper">
        <div className="hero-dots" role="tablist" aria-label="Hero slides">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`hero-dot${i === index ? " active" : ""}`}
              onClick={() => setPage([i, i > index ? 1 : -1])}
              aria-label={`Slide ${i + 1}`}
              role="tab"
              aria-selected={i === index}
              type="button"
            />
          ))}
        </div>

        <div className="hero-progress-ring-container" title="Slide timer">
          <svg className="hero-progress-ring" width="26" height="26" viewBox="0 0 36 36">
            <circle
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="rgba(255, 255, 255, 0.25)"
              strokeWidth="3.5"
            />
            <motion.circle
              key={page}
              cx="18"
              cy="18"
              r="14"
              fill="none"
              stroke="var(--light-coral)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="87.96"
              initial={{ strokeDashoffset: 87.96 }}
              animate={{ strokeDashoffset: 0 }}
              transition={{ duration: 4.5, ease: "linear" }}
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            />
          </svg>
        </div>
      </div>
    </section>
  );
}
