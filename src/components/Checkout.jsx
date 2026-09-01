import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../data/storeData";
import confetti from "canvas-confetti";
import {
  CheckCircle2,
  CreditCard,
  Truck,
  User,
} from "lucide-react";
import { motion } from "framer-motion";

export default function Checkout() {
  const { cart, cartTotals, navigateTo, clearCart, submitOrder, addToast } = useStore();
  const { t, lang } = useLanguage();
  const isAr = lang === "ar";

  // Form Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhoneSecondary, setCustomerPhoneSecondary] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cod");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [submitError, setSubmitError] = useState("");

  const handleCompleteOrder = async (e) => {
    if (e) e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setSubmitError(
        isAr
          ? "يرجى استكمال الاسم ورقم الهاتف وعنوان الشحن قبل تأكيد الطلب."
          : "Complete your name, phone number, and shipping address before confirming the order."
      );
      addToast(
        isAr ? "يرجى استكمال بيانات التواصل وعنوان الشحن." : "Please complete your contact and shipping address.",
        "warning"
      );
      return;
    }

    setSubmitError("");
    setIsSubmitting(true);

    try {
      const result = await submitOrder({
        customerName,
        customerPhone,
        customerPhoneSecondary,
        shippingAddress: shippingAddress.trim(),
        notes,
        paymentMethod,
        subtotalPrice: cartTotals.subtotal,
        totalShippingFee: cartTotals.shipping,
        totalDiscount: cartTotals.discount,
        finalPrice: cartTotals.grandTotal,
        items: cart,
      });

      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 },
      });

      setCompletedOrder(result);
      clearCart();
    } catch (err) {
      console.error("Order submission failed:", err);
      setSubmitError(
        isAr
          ? "تعذر حفظ الطلب. لم يتم خصم أي مبلغ، وما زالت بياناتك وسلة المشتريات محفوظة. حاول مرة أخرى."
          : "We couldn't save the order. No payment was taken, and your details and cart are still saved. Try again."
      );
      addToast(
        isAr ? "تعذر حفظ الطلب — حاول مرة أخرى." : "Order was not saved — try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (completedOrder) {
    return (
      <div className="section-container" style={{ textAlign: "center", padding: "5rem 1rem" }}>
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="order-success-card"
        >
          <div className="order-success-icon-badge">
            <CheckCircle2 size={64} color="var(--light-coral)" />
          </div>

          <span className="order-code-chip">
            {isAr ? "رقم الطلب المؤكد:" : "Confirmed Order #:"} <strong>{completedOrder.orderCode}</strong>
          </span>

          <h1 style={{ fontSize: "2.25rem", color: "var(--prussian-blue)", margin: "0.85rem 0" }}>
            {t("checkout.successTitle")}
          </h1>
          <p style={{ fontSize: "1.05rem", color: "var(--steel-blue)", maxWidth: 580, margin: "0 auto 1.5rem" }}>
            {t("checkout.successDesc")}
          </p>

          <div className="order-summary-box">
            <div className="order-summary-line">
              <span>{isAr ? "العميل:" : "Customer:"}</span>
              <strong>{completedOrder.customerName || customerName}</strong>
            </div>
            <div className="order-summary-line">
              <span>{isAr ? "طريقة الدفع:" : "Payment:"}</span>
              <strong>{paymentMethod === "cod" ? (isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery") : (isAr ? "بطاقة ائتمان" : "Credit Card")}</strong>
            </div>
            <div className="order-summary-line highlight">
              <span>{isAr ? "الإجمالي النهائي:" : "Total Paid / Due:"}</span>
              <strong>{formatCurrency(completedOrder.finalPrice || cartTotals.grandTotal, lang)}</strong>
            </div>
          </div>

          <button
            onClick={() => {
              setCompletedOrder(null);
              navigateTo("home");
            }}
            className="btn btn-primary"
            style={{ marginTop: "2rem", padding: "0.85rem 2.25rem" }}
          >
            {t("checkout.returnHome")}
          </button>
        </motion.div>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="section-container" style={{ textAlign: "center", padding: "5rem 1rem" }}>
        <h2>{t("checkout.empty")}</h2>
        <button onClick={() => navigateTo("catalog")} className="btn btn-primary" style={{ marginTop: "1.5rem" }}>
          {t("checkout.emptyShop")}
        </button>
      </div>
    );
  }

  return (
    <div className="section-container">
      <h1 style={{ fontSize: "2.25rem", color: "var(--prussian-blue)", marginBottom: "2rem" }}>
        {t("checkout.title")}
      </h1>

      <form onSubmit={handleCompleteOrder} className="checkout-layout" noValidate>
        {/* Left: Form */}
        <div>
          <div className="checkout-card" style={{ marginBottom: "2rem" }}>
            <h3 style={{ fontSize: "1.25rem", marginBottom: "1rem", color: "var(--prussian-blue)", display: "flex", alignItems: "center", gap: 8 }}>
              <User size={20} color="var(--blue-bell)" /> 1. {t("checkout.contact")}
            </h3>

              {submitError && (
                <div className="checkout-form-error" role="alert" aria-live="assertive">
                  {submitError}
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div className="form-grid-2">
                  <label className="checkout-field" htmlFor="checkout-name">
                    <span>{isAr ? "الاسم بالكامل *" : "Full name *"}</span>
                    <input
                      id="checkout-name"
                      className="checkout-form-input"
                      type="text"
                      autoComplete="name"
                      required
                      value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setSubmitError(""); }}
                    />
                  </label>
                  <label className="checkout-field" htmlFor="checkout-phone">
                    <span>{isAr ? "رقم الهاتف الأساسي *" : "Primary phone *"}</span>
                    <input
                      id="checkout-phone"
                      className="checkout-form-input"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => { setCustomerPhone(e.target.value); setSubmitError(""); }}
                    />
                  </label>
                </div>

                <label className="checkout-field" htmlFor="checkout-secondary-phone">
                  <span>{isAr ? "رقم هاتف إضافي (اختياري)" : "Secondary phone (optional)"}</span>
                  <input
                    id="checkout-secondary-phone"
                    className="checkout-form-input"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={customerPhoneSecondary}
                    onChange={(e) => setCustomerPhoneSecondary(e.target.value)}
                  />
                </label>

                <label className="checkout-field" htmlFor="checkout-address">
                  <span>{isAr ? "العنوان بالتفصيل *" : "Street and building address *"}</span>
                  <input
                    id="checkout-address"
                    className="checkout-form-input"
                    type="text"
                    autoComplete="street-address"
                    required
                    value={shippingAddress}
                    onChange={(e) => { setShippingAddress(e.target.value); setSubmitError(""); }}
                  />
                </label>

                <label className="checkout-field" htmlFor="checkout-notes">
                  <span>{isAr ? "ملاحظات التوصيل (اختياري)" : "Delivery notes (optional)"}</span>
                  <textarea
                    id="checkout-notes"
                    className="checkout-form-input checkout-textarea resize-none"
                    rows={3}
                    style={{ resize: "none" }}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </label>
              </div>
          </div>

          <div className="checkout-card">
            <h3
              style={{
                fontSize: "1.25rem",
                marginBottom: "1rem",
                color: "var(--prussian-blue)",
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <CreditCard size={20} color="var(--blue-bell)" /> 2. {t("checkout.payment")}
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "1.5rem" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  border: paymentMethod === "cod" ? "1.5px solid var(--blue-bell)" : "1px solid var(--border-light)",
                  borderRadius: "var(--border-radius)",
                  background: paymentMethod === "cod" ? "var(--alice-blue)" : "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                />{" "}
                <Truck size={18} /> {isAr ? "الدفع نقدًا عند الاستلام (COD)" : "Cash on Delivery (COD)"}
              </label>

              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.75rem",
                  padding: "0.85rem",
                  border: paymentMethod === "card" ? "1.5px solid var(--blue-bell)" : "1px solid var(--border-light)",
                  borderRadius: "var(--border-radius)",
                  background: paymentMethod === "card" ? "var(--alice-blue)" : "transparent",
                  cursor: "pointer",
                  fontWeight: 600,
                  opacity: 0.55,
                }}
              >
                <input
                  type="radio"
                  name="payMethod"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  disabled
                />{" "}
                <CreditCard size={18} /> {t("checkout.payCard")} <small>{isAr ? "(قريباً)" : "(coming soon)"}</small>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-full"
              style={{ padding: "1rem", fontSize: "1.1rem" }}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isAr ? "جاري تأكيد الطلب وحفظه في قاعدة البيانات..." : "Submitting Order to Database..."
                : isAr ? `إتمام الطلب (${formatCurrency(cartTotals.grandTotal, "ar")})` : `Complete Order (${formatCurrency(cartTotals.grandTotal, "en")})`}
            </button>
          </div>
        </div>

        {/* Right: Summary */}
        <div className="checkout-card checkout-summary">
          <h3 style={{ fontSize: "1.25rem", marginBottom: "1.25rem", color: "var(--prussian-blue)" }}>
            {t("checkout.summary")}
          </h3>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              maxHeight: 280,
              overflowY: "auto",
              paddingRight: "0.5rem",
              marginBottom: "1.5rem",
            }}
          >
            {cart.map((item) => {
              const itemName = isAr ? (item.nameAr || item.name) : (item.name || item.nameAr);
              return (
                <div key={item.id} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <img
                    src={item.image}
                    alt={itemName}
                    loading="lazy"
                    decoding="async"
                    style={{ width: 50, height: 50, objectFit: "contain", background: "var(--alice-blue)", borderRadius: 4, padding: 4 }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "0.875rem", fontWeight: 700 }}>{itemName}</div>
                    <div style={{ fontSize: "0.8rem", color: "var(--steel-blue)" }}>
                      {isAr ? `الكمية: ${item.quantity}` : `Qty: ${item.quantity}`}
                    </div>
                  </div>
                  <div style={{ fontWeight: 800, color: "var(--prussian-blue)" }}>
                    {formatCurrency(item.price * item.quantity, lang)}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="cart-totals-breakdown">
            <div className="totals-row">
              <span>{t("cart.subtotal")}</span>
              <span>{formatCurrency(cartTotals.subtotal, lang)}</span>
            </div>
            <div className="totals-row">
              <span>{t("cart.shipping")}</span>
              <span>{cartTotals.shipping === 0 ? <strong style={{ color: "var(--blue-bell)" }}>{t("cart.free")}</strong> : formatCurrency(cartTotals.shipping, lang)}</span>
            </div>
            {cartTotals.discount > 0 && (
              <div className="totals-row discount">
                <span>{t("cart.discount")}</span>
                <span>-{formatCurrency(cartTotals.discount, lang)}</span>
              </div>
            )}
            <div className="totals-row grand-total">
              <span>{t("cart.total")}</span>
              <span>{formatCurrency(cartTotals.grandTotal, lang)}</span>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
