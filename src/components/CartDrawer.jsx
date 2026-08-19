import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { X, Trash2, Tag, ArrowRight, ShoppingCart, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../data/storeData";

export default function CartDrawer() {
  const {
    cart,
    updateCartQty,
    removeFromCart,
    isCartOpen,
    setIsCartOpen,
    appliedCoupon,
    applyCoupon,
    removeCoupon,
    cartTotals,
    navigateTo
  } = useStore();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  const [couponInput, setCouponInput] = useState("");

  return (
    <AnimatePresence>
      {isCartOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="drawer-backdrop open"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsCartOpen(false);
          }}
        >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="cart-drawer"
          >
          <div className="drawer-header">
            <div className="drawer-title">{t("cart.title")}</div>
            <button
              onClick={() => setIsCartOpen(false)}
              className="drawer-close-btn"
              aria-label={t("cart.close")}
            >
              <X size={22} />
            </button>
          </div>

          <div className="drawer-body">
            {cart.length === 0 ? (
              <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
                <ShoppingCart size={54} color="var(--steel-blue)" style={{ margin: "0 auto 1rem auto" }} />
                <h4 style={{ fontSize: "1.1rem", color: "var(--text-main)" }}>{t("cart.empty")}</h4>
                <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>{t("cart.emptyDesc")}</p>
                <button
                  onClick={() => {
                    setIsCartOpen(false);
                    navigateTo("catalog");
                  }}
                  className="btn btn-primary"
                  style={{ marginTop: "1.5rem" }}
                >
                  {t("cart.browse")}
                </button>
              </div>
            ) : (
              cart.map((item) => {
                const lineDiscount = cartTotals.lineItemDiscounts[item.id] || 0;
                const itemName = isRtl ? (item.nameAr || item.name) : (item.name || item.nameAr);
                const itemDesc = isRtl ? (item.shortDescAr || item.shortDesc) : (item.shortDesc || item.shortDescAr);
                return (
                  <div key={item.id} className="cart-item-row">
                    <img src={item.image} alt={itemName} loading="lazy" decoding="async" className="cart-item-img" />
                    <div className="cart-item-details">
                      <div className="cart-item-title">{itemName}</div>
                      {itemDesc && (
                        <div className="cart-spec-chip spec-mono" style={{ fontSize: "0.75rem", color: "var(--steel-blue)", marginTop: 2, marginBottom: 2 }}>
                          {itemDesc}
                        </div>
                      )}
                      <div className="cart-item-price">
                        {formatCurrency(item.price, lang)}
                        {lineDiscount > 0 && (
                          <span style={{ fontSize: "0.75rem", color: "var(--light-coral)", marginLeft: 6 }}>
                            {t("cart.off", { amount: formatCurrency(lineDiscount, lang) })}
                          </span>
                        )}
                      </div>
                      <div className="qty-controls">
                        <button className="qty-btn" onClick={() => updateCartQty(item.id, -1)}>-</button>
                        <span style={{ padding: "0 8px", fontSize: "0.85rem", fontWeight: 600 }}>{item.quantity}</span>
                        <button className="qty-btn" onClick={() => updateCartQty(item.id, 1)}>+</button>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {cart.length > 0 && (
            <div className="drawer-footer">
              {/* Coupon Box */}
              <div style={{ background: "var(--surface-card)", padding: "0.75rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border-light)" }}>
                {appliedCoupon && cartTotals.couponObj ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", fontSize: "0.85rem", color: "var(--blue-bell)", fontWeight: 600 }}>
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <Tag size={16} />
                      {appliedCoupon} ({cartTotals.couponObj.badge})
                    </span>
                    <button
                      onClick={removeCoupon}
                      style={{ background: "none", border: "none", color: "var(--light-coral)", cursor: "pointer", fontWeight: 700 }}
                    >
                      {t("cart.remove")}
                    </button>
                  </div>
                ) : (
                  <div className="coupon-input-group">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="coupon-input"
                      placeholder={t("cart.couponPlaceholder")}
                    />
                    <button
                      onClick={() => {
                        if (applyCoupon(couponInput)) setCouponInput("");
                      }}
                      className="btn btn-dark btn-sm"
                    >
                      {t("cart.apply")}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals Summary */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.875rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                  <span>{t("cart.subtotal")}</span>
                  <span>{formatCurrency(cartTotals.subtotal, lang)}</span>
                </div>
                {cartTotals.totalSavings > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--light-coral)", fontWeight: 600 }}>
                    <span>{t("cart.couponSavings")}</span>
                    <span>-{formatCurrency(cartTotals.totalSavings, lang)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--text-muted)" }}>
                  <span>{t("cart.shipping")}</span>
                  <span>{cartTotals.shippingCost === 0 ? <strong style={{ color: "var(--blue-bell)" }}>{t("cart.free")}</strong> : formatCurrency(cartTotals.shippingCost, lang)}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "1.15rem", fontWeight: 800, color: "var(--prussian-blue)", marginTop: "0.5rem", paddingTop: "0.5rem", borderTop: "1px solid var(--border-light)" }}>
                  <span>{t("cart.grandTotal")}</span>
                  <span>{formatCurrency(cartTotals.grandTotal, lang)}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  setIsCartOpen(false);
                  navigateTo("checkout");
                }}
                className="btn btn-primary btn-full"
                style={{ padding: "0.85rem", fontSize: "1rem" }}
              >
                {t("cart.checkout")} <ArrowRight size={18} className={isAr ? "icon-flip-rtl" : ""} />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);
}
