import React from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { Home, Grid, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function MobileBottomNav() {
  const { currentRoute, navigateTo, cart, setIsCartOpen } = useStore();
  const { t } = useLanguage();

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="mobile-bottom-nav">
      <button
        onClick={() => navigateTo("home")}
        className={`mobile-nav-btn ${currentRoute === "home" ? "active" : ""}`}
      >
        <Home size={20} />
        <span>{t("mobile.home")}</span>
      </button>

      <button
        onClick={() => navigateTo("catalog")}
        className={`mobile-nav-btn ${currentRoute === "catalog" ? "active" : ""}`}
      >
        <Grid size={20} />
        <span>{t("mobile.catalog")}</span>
      </button>

      <button
        onClick={() => setIsCartOpen(true)}
        className="mobile-nav-btn"
      >
        <div style={{ position: "relative" }}>
          <ShoppingBag size={20} />
          {totalCartCount > 0 && (
            <motion.span key={totalCartCount} initial={{ scale: 0 }} animate={{ scale: 1 }} className="mobile-badge-counter">
              {totalCartCount}
            </motion.span>
          )}
        </div>
        <span>{t("mobile.cart")}</span>
      </button>
    </div>
  );
}
