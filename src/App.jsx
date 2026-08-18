import React, { lazy, Suspense, useState, useEffect } from "react";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { StoreProvider, useStore } from "./context/StoreContext";
import { updateSeo } from "./utils/seoManager";
import Preloader from "./components/Preloader";
import Header from "./components/Header";
import ToastContainer from "./components/ToastContainer";
import MobileBottomNav from "./components/MobileBottomNav";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";

import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Home = lazy(() => import("./components/Home"));
const Catalog = lazy(() => import("./components/Catalog"));
const ProductDetail = lazy(() => import("./components/ProductDetail"));
const Checkout = lazy(() => import("./components/Checkout"));
const CartDrawer = lazy(() => import("./components/CartDrawer"));
const AiAssistant = lazy(() => import("./components/AiAssistant"));
const AdminModal = lazy(() => import("./components/AdminModal"));
const AdminDashboard = lazy(() => import("./components/AdminDashboard"));
const SupplierDashboard = lazy(() => import("./components/SupplierDashboard"));

function RouteFallback() {
  return (
    <div className="route-fallback" role="status" aria-label="Loading page">
      <div className="route-fallback-spinner" />
    </div>
  );
}

function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  React.useEffect(() => {
    let ticking = false;

    const updateScrollMetrics = () => {
      const scrollY = window.scrollY;
      setVisible(scrollY > 400);

      const totalScrollable =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalScrollable > 0) {
        const progress = Math.min(Math.max(scrollY / totalScrollable, 0), 1);
        setScrollProgress(progress);
      } else {
        setScrollProgress(0);
      }
      ticking = false;
    };

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(updateScrollMetrics);
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollMetrics();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const radius = 20;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - scrollProgress * circumference;

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={scrollToTop}
          className="scroll-to-top-btn"
          aria-label="Scroll to top"
        >
          <svg
            className="scroll-progress-ring"
            width="48"
            height="48"
            viewBox="0 0 48 48"
          >
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="rgba(255, 255, 255, 0.2)"
              strokeWidth="3"
            />
            <circle
              cx="24"
              cy="24"
              r={radius}
              fill="none"
              stroke="var(--blue-bell)"
              strokeWidth="3"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <ArrowUp size={22} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}

function MainApp() {
  const { currentRoute, isAdminOpen, setIsAdminOpen } = useStore();
  const { lang, isRtl } = useLanguage();
  const [isPreloaderDone, setIsPreloaderDone] = useState(() => {
    try {
      return sessionStorage.getItem("nova_assets_loaded") === "1";
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (currentRoute === "admin-dashboard") {
      updateSeo({
        title: isRtl ? "لوحة تحكم العمليات الرئيسية" : "Master Admin Portal",
        path: "/admin",
        isPrivate: true,
        lang,
      });
    } else if (currentRoute === "supplier-dashboard") {
      updateSeo({
        title: isRtl ? "بوابة الموردين والطلبات" : "Supplier Fulfillment Portal",
        path: "/vendor",
        isPrivate: true,
        lang,
      });
    } else if (currentRoute === "catalog") {
      updateSeo({
        title: isRtl ? "الكتالوج وجميع الأقسام" : "Catalog & All Departments",
        description: isRtl
          ? "تصفح أحدث أجهزة اللابتوب، الشاشات، وإكسسوارات الجيمنج بأسعار حصرية وضمان رسمي في مصر."
          : "Browse high-performance laptops, ultra-wide monitors, and accessories with instant delivery across Egypt.",
        path: "/catalog",
        lang,
      });
    } else if (currentRoute === "checkout") {
      updateSeo({
        title: isRtl ? "إتمام الطلب والدفع عند الاستلام" : "Checkout & Cash on Delivery",
        path: "/checkout",
        lang,
      });
    } else if (currentRoute === "home") {
      updateSeo({
        title: "High Quality and Best Prices",
        path: "/",
        lang,
      });
    }
  }, [currentRoute, lang, isRtl]);

  // Dedicated full-screen Dashboards
  if (currentRoute === "admin-dashboard") {
    return (
      <Suspense fallback={<RouteFallback />}>
        <AdminDashboard />
        <ToastContainer />
      </Suspense>
    );
  }

  if (currentRoute === "supplier-dashboard") {
    return (
      <Suspense fallback={<RouteFallback />}>
        <SupplierDashboard />
        <ToastContainer />
      </Suspense>
    );
  }

  return (
    <>
      {!isPreloaderDone && (
        <Preloader onComplete={() => setIsPreloaderDone(true)} />
      )}

      <Header />

      <main>
        <Suspense fallback={<RouteFallback />}>
          {currentRoute === "home" && <Home />}
          {currentRoute === "catalog" && <Catalog />}
          {currentRoute === "product" && <ProductDetail />}
          {currentRoute === "checkout" && <Checkout />}
        </Suspense>
      </main>

      <Footer />

      <Suspense fallback={null}>
        <CartDrawer />
        <AiAssistant />
        <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
      </Suspense>

      <ToastContainer />
      <MobileBottomNav />
      <WhatsAppButton />
      <ScrollToTopButton />
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <StoreProvider>
        <MainApp />
      </StoreProvider>
    </LanguageProvider>
  );
}
