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
  ShieldCheck,
  Phone,
  MapPin,
  FileText,
  ChevronRight,
  Copy,
  Check,
  ShoppingBag,
  Lock,
  MessageCircle,
  Clock,
  Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Checkout() {
  const { cart, cartTotals, navigateTo, clearCart, submitOrder, addToast } = useStore();
  const { t, lang, isRtl } = useLanguage();
  const isAr = isRtl || lang === "ar";

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
  const [copiedCode, setCopiedCode] = useState(false);

  const handleCopyOrderCode = (code) => {
    if (!code) return;
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(true);
      addToast(isAr ? "تم نسخ رقم الطلب بنجاح!" : "Order number copied!", "success");
      setTimeout(() => setCopiedCode(false), 2500);
    });
  };

  const handleCompleteOrder = async (e) => {
    if (e) e.preventDefault();

    if (!customerName.trim() || !customerPhone.trim() || !shippingAddress.trim()) {
      setSubmitError(
        isAr
          ? "يرجى استكمال الاسم ورقم الهاتف وعنوان التوصيل قبل تأكيد الطلب."
          : "Please complete your full name, phone number, and shipping address."
      );
      addToast(
        isAr ? "يرجى استكمال الحقول المطلوبة." : "Please fill in all required fields.",
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
        totalShippingFee: 0,
        totalDiscount: cartTotals.discount || 0,
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
          ? "تعذر حفظ الطلب حالياً. يرجى المحاولة مرة أخرى أو التواصل معنا عبر واتساب."
          : "Could not place order. Please try again or contact us via WhatsApp."
      );
      addToast(
        isAr ? "تعذر حفظ الطلب — حاول مرة أخرى." : "Order failed — please try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /* ─────────────────────────────────────────────────────────────
     SUCCESS INVOICE / RECEIPT SCREEN
     ───────────────────────────────────────────────────────────── */
  if (completedOrder) {
    const waText = encodeURIComponent(
      isAr
        ? `مرحباً، أود متابعة طلبي رقم: ${completedOrder.orderCode} باسم: ${completedOrder.customerName || customerName}`
        : `Hello, I'd like to follow up on my order #${completedOrder.orderCode} for: ${completedOrder.customerName || customerName}`
    );
    const waUrl = `https://wa.me/201509999283?text=${waText}`;

    return (
      <div className="section-container" style={{ padding: "3rem 1rem 5rem", maxWidth: "800px" }}>
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="order-success-receipt"
        >
          {/* Header Icon Badge */}
          <div className="order-success-hero">
            <div className="order-success-icon-pulse">
              <CheckCircle2 size={48} className="order-success-check-icon" />
            </div>
            <h1 className="order-success-title">
              {isAr ? "تم استلام وتأكيد طلبك بنجاح!" : "Order Confirmed Successfully!"}
            </h1>
            <p className="order-success-subtitle">
              {isAr
                ? "شكراً لثقتك في متجر نوفا ستور. سنقوم بالتواصل معك هاتفياً أو عبر واتساب لتأكيد موعد الشحن والتوصيل."
                : "Thank you for choosing Nova Store. We will contact you via phone or WhatsApp to coordinate delivery."}
            </p>
          </div>

          {/* Order Code Banner */}
          <div className="order-code-box">
            <div>
              <span className="order-code-label">{isAr ? "رقم الطلب الخاص بك" : "Your Order Number"}</span>
              <div className="order-code-value">{completedOrder.orderCode}</div>
            </div>
            <button
              type="button"
              className="btn-copy-code"
              onClick={() => handleCopyOrderCode(completedOrder.orderCode)}
              aria-label="Copy order code"
            >
              {copiedCode ? <Check size={16} /> : <Copy size={16} />}
              <span>{copiedCode ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الكود" : "Copy")}</span>
            </button>
          </div>

          {/* Customer & Delivery Summary Details */}
          <div className="receipt-details-grid">
            <div className="receipt-detail-item">
              <span className="receipt-detail-label">
                <User size={15} /> {isAr ? "الاسم" : "Customer"}
              </span>
              <strong className="receipt-detail-val">{completedOrder.customerName || customerName}</strong>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">
                <Phone size={15} /> {isAr ? "رقم الهاتف" : "Phone"}
              </span>
              <strong className="receipt-detail-val font-mono">{customerPhone}</strong>
            </div>

            <div className="receipt-detail-item" style={{ gridColumn: "1 / -1" }}>
              <span className="receipt-detail-label">
                <MapPin size={15} /> {isAr ? "عنوان التوصيل" : "Delivery Address"}
              </span>
              <strong className="receipt-detail-val">{shippingAddress}</strong>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">
                <Truck size={15} /> {isAr ? "طريقة الدفع" : "Payment Method"}
              </span>
              <strong className="receipt-detail-val">
                {isAr ? "الدفع عند الاستلام (COD)" : "Cash on Delivery (COD)"}
              </strong>
            </div>

            <div className="receipt-detail-item">
              <span className="receipt-detail-label">
                <Clock size={15} /> {isAr ? "حالة الشحن" : "Shipping Status"}
              </span>
              <span className="receipt-status-badge">
                <span className="receipt-status-dot" />
                {isAr ? "جاري التجهيز للشحن" : "Processing for Shipping"}
              </span>
            </div>
          </div>

          {/* Total Amount Box */}
          <div className="receipt-total-banner">
            <div>
              <div className="receipt-total-title">{isAr ? "إجمالي المنتجات المطلوب دفعها" : "Products Total"}</div>
              <small className="receipt-total-sub">{isAr ? "(مصاريف الشحن يتم تحديدها عند التواصل والتأكيد)" : "(Shipping fee determined upon contact and confirmation)"}</small>
            </div>
            <div className="receipt-total-amount font-mono">
              {formatCurrency(completedOrder.finalPrice || cartTotals.grandTotal, lang)}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="receipt-actions-row">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-whatsapp-confirm"
            >
              <MessageCircle size={18} />
              <span>{isAr ? "متابعة الطلب على واتساب" : "Track Order on WhatsApp"}</span>
            </a>

            <button
              type="button"
              onClick={() => {
                setCompletedOrder(null);
                navigateTo("home");
              }}
              className="btn btn-secondary-home"
            >
              <span>{isAr ? "العودة للرئيسية والتسوق" : "Return to Store"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     EMPTY CART CHECKOUT STATE
     ───────────────────────────────────────────────────────────── */
  if (cart.length === 0) {
    return (
      <div className="section-container" style={{ textAlign: "center", padding: "6rem 1rem" }}>
        <div className="checkout-empty-box">
          <ShoppingBag size={56} className="checkout-empty-icon" />
          <h2 style={{ fontSize: "1.6rem", color: "var(--prussian-blue)", margin: "1rem 0 0.5rem" }}>
            {t("checkout.empty")}
          </h2>
          <p style={{ color: "var(--steel-blue)", maxWidth: 440, margin: "0 auto 1.75rem" }}>
            {isAr ? "لم تقم بإضافة أي منتجات إلى سلة المشتريات بعد." : "You haven't added any products to your cart yet."}
          </p>
          <button
            onClick={() => navigateTo("catalog")}
            className="btn btn-primary"
            style={{ padding: "0.85rem 2rem", fontSize: "1rem" }}
          >
            {t("checkout.emptyShop")}
          </button>
        </div>
      </div>
    );
  }

  /* ─────────────────────────────────────────────────────────────
     ACTIVE CHECKOUT FORM & SUMMARY
     ───────────────────────────────────────────────────────────── */
  return (
    <div className="section-container" style={{ paddingTop: "1.5rem", paddingBottom: "4rem" }}>
      {/* Breadcrumb Bar */}
      <nav className="breadcrumbs" style={{ marginBottom: "1.5rem" }}>
        <button type="button" onClick={() => navigateTo("home")}>{t("catalog.breadcrumbHome")}</button>
        <ChevronRight size={14} />
        <button type="button" onClick={() => navigateTo("catalog")}>{isAr ? "الكتالوج" : "Catalog"}</button>
        <ChevronRight size={14} />
        <span className="breadcrumb-current">{isAr ? "إتمام الطلب" : "Checkout"}</span>
      </nav>

      {/* Page Title & Trust Header */}
      <div className="checkout-header-intro">
        <h1 className="checkout-main-heading">
          {isAr ? "إتمام الطلب والدفع عند الاستلام" : "Checkout & Order Confirmation"}
        </h1>
        <p className="checkout-subheading">
          {isAr
            ? "أدخل بياناتك للتوصيل السريع — ادفع نقدًا بعد معاينة واستلام المنتج"
            : "Enter your delivery details — pay cash only upon inspecting and receiving your package"}
        </p>
      </div>

      <form onSubmit={handleCompleteOrder} className="checkout-layout" noValidate>
        {/* Left Column: Form Details */}
        <div className="checkout-form-column">
          {/* STEP 1: Contact & Delivery Information */}
          <div className="checkout-card">
            <div className="checkout-step-header">
              <span className="checkout-step-badge">1</span>
              <div>
                <h2 className="checkout-step-title">{isAr ? "معلومات التواصل وعنوان التوصيل" : "Contact & Delivery Details"}</h2>
                <p className="checkout-step-desc">{isAr ? "سنستخدم هذه البيانات للتواصل معك وتسليم الشحنة" : "We'll use this to contact you and deliver your order"}</p>
              </div>
            </div>

            {submitError && (
              <div className="checkout-form-error" role="alert">
                {submitError}
              </div>
            )}

            <div className="checkout-fields-container">
              <div className="checkout-fields-grid-2">
                <label className="checkout-field" htmlFor="checkout-name">
                  <span className="checkout-label-text">
                    {isAr ? "الاسم بالكامل" : "Full Name"} <span className="field-required">*</span>
                  </span>
                  <div className="checkout-input-wrapper">
                    <User size={18} className="checkout-field-icon" />
                    <input
                      id="checkout-name"
                      className="checkout-form-input with-icon"
                      type="text"
                      autoComplete="name"
                      required
                      placeholder={isAr ? "مثال: مصطفى أحمد" : "e.g. Mostafa Ahmed"}
                      value={customerName}
                      onChange={(e) => { setCustomerName(e.target.value); setSubmitError(""); }}
                    />
                  </div>
                </label>

                <label className="checkout-field" htmlFor="checkout-phone">
                  <span className="checkout-label-text">
                    {isAr ? "رقم الهاتف الأساسي (واتساب)" : "Primary Phone"} <span className="field-required">*</span>
                  </span>
                  <div className="checkout-input-wrapper">
                    <Phone size={18} className="checkout-field-icon" />
                    <input
                      id="checkout-phone"
                      className="checkout-form-input with-icon font-mono"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel"
                      required
                      placeholder={isAr ? "010XXXXXXXX" : "010XXXXXXXX"}
                      value={customerPhone}
                      onChange={(e) => { setCustomerPhone(e.target.value); setSubmitError(""); }}
                    />
                  </div>
                </label>
              </div>

              <div className="checkout-fields-grid-2">
                <label className="checkout-field" htmlFor="checkout-secondary-phone">
                  <span className="checkout-label-text">
                    {isAr ? "رقم هاتف إضافي" : "Secondary Phone"} <span className="field-optional">{isAr ? "(اختياري)" : "(optional)"}</span>
                  </span>
                  <div className="checkout-input-wrapper">
                    <Phone size={18} className="checkout-field-icon" />
                    <input
                      id="checkout-secondary-phone"
                      className="checkout-form-input with-icon font-mono"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      placeholder={isAr ? "رقم احتياطي للطوارئ" : "Alternative contact number"}
                      value={customerPhoneSecondary}
                      onChange={(e) => setCustomerPhoneSecondary(e.target.value)}
                    />
                  </div>
                </label>

                <div className="checkout-field-tip-box">
                  <Sparkles size={16} className="tip-icon" />
                  <span>{isAr ? "سنقوم بالتواصل معك عبر الهاتف أو واتساب لتأكيد موعد التوصيل قبل التحرك." : "We'll confirm via WhatsApp or call before our courier dispatches."}</span>
                </div>
              </div>

              <label className="checkout-field" htmlFor="checkout-address">
                <span className="checkout-label-text">
                  {isAr ? "العنوان بالتفصيل (المحافظة - المدينة - الشارع - رقم العقار)" : "Full Delivery Address"} <span className="field-required">*</span>
                </span>
                <div className="checkout-input-wrapper">
                  <MapPin size={18} className="checkout-field-icon top-aligned" />
                  <textarea
                    id="checkout-address"
                    className="checkout-form-input with-icon checkout-textarea"
                    rows={2}
                    required
                    placeholder={isAr ? "مثال: القاهرة، مدينة نصر، شارع عباس العقاد، عمارة 15 الدور الرابع" : "e.g. Cairo, Nasr City, Abbas El Akkad St, Bldg 15, 4th floor"}
                    value={shippingAddress}
                    onChange={(e) => { setShippingAddress(e.target.value); setSubmitError(""); }}
                  />
                </div>
              </label>

              <label className="checkout-field" htmlFor="checkout-notes">
                <span className="checkout-label-text">
                  {isAr ? "ملاحظات إضافية للتوصيل" : "Delivery Notes"} <span className="field-optional">{isAr ? "(اختياري)" : "(optional)"}</span>
                </span>
                <div className="checkout-input-wrapper">
                  <FileText size={18} className="checkout-field-icon top-aligned" />
                  <textarea
                    id="checkout-notes"
                    className="checkout-form-input with-icon checkout-textarea"
                    rows={2}
                    placeholder={isAr ? "أي تعليمات خاصة للمندوب أو أوقات الاستلام المناسبة" : "Special instructions for the courier"}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </label>
            </div>
          </div>

          {/* STEP 2: Payment Method */}
          <div className="checkout-card" style={{ marginTop: "1.5rem" }}>
            <div className="checkout-step-header">
              <span className="checkout-step-badge">2</span>
              <div>
                <h2 className="checkout-step-title">{isAr ? "طريقة الدفع" : "Payment Method"}</h2>
                <p className="checkout-step-desc">{isAr ? "اختر طريقة السداد المناسبة لك" : "Select your preferred payment method"}</p>
              </div>
            </div>

            <div className="payment-options-container">
              {/* Option 1: COD (Active & Recommended) */}
              <label className={`payment-option-card${paymentMethod === "cod" ? " selected" : ""}`}>
                <div className="payment-radio-wrap">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === "cod"}
                    onChange={() => setPaymentMethod("cod")}
                    className="payment-radio-input"
                  />
                </div>
                <div className="payment-icon-box">
                  <Truck size={22} className="payment-type-icon" />
                </div>
                <div className="payment-text-content">
                  <div className="payment-title-row">
                    <span className="payment-method-name">{isAr ? "الدفع نقدًا عند الاستلام (COD)" : "Cash on Delivery (COD)"}</span>
                    <span className="payment-recommend-badge">{isAr ? "موصى به" : "Recommended"}</span>
                  </div>
                  <p className="payment-method-desc">
                    {isAr ? "ادفع كاش للمندوب بعد استلام ومعاينة أجهزتك وفحصها بالكامل." : "Pay cash to the courier after inspecting your hardware."}
                  </p>
                </div>
              </label>

              {/* Option 2: Card (Coming Soon) */}
              <label className="payment-option-card disabled">
                <div className="payment-radio-wrap">
                  <input
                    type="radio"
                    name="payMethod"
                    checked={paymentMethod === "card"}
                    onChange={() => setPaymentMethod("card")}
                    disabled
                    className="payment-radio-input"
                  />
                </div>
                <div className="payment-icon-box">
                  <CreditCard size={22} className="payment-type-icon" />
                </div>
                <div className="payment-text-content">
                  <div className="payment-title-row">
                    <span className="payment-method-name">{isAr ? "بطاقة بنكية / فيزا ومستركارد" : "Credit / Debit Card"}</span>
                    <span className="payment-soon-badge">{isAr ? "قريباً" : "Coming Soon"}</span>
                  </div>
                  <p className="payment-method-desc">
                    {isAr ? "بوابات الدفع الإلكتروني بالتقسيط والبطاقات البنكية قيد التفعيل." : "Card & installment options currently being integrated."}
                  </p>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Column: Order Summary & Confirmation */}
        <div className="checkout-summary-column">
          <div className="checkout-card checkout-summary-card">
            <h3 className="summary-card-heading">
              <ShoppingBag size={20} className="summary-heading-icon" />
              <span>{t("checkout.summary")}</span>
              <span className="summary-items-count">({cart.reduce((s, i) => s + (i.quantity || 1), 0)})</span>
            </h3>

            {/* Cart Items List */}
            <div className="summary-items-scroll">
              {cart.map((item) => {
                const itemName = isAr ? (item.nameAr || item.name) : (item.name || item.nameAr);
                const itemImg = item.image || item.product?.image || "/Assets/Images/Laptop.webp";
                return (
                  <div key={item.id} className="summary-item-row">
                    <div className="summary-img-box">
                      <img
                        src={itemImg}
                        alt={itemName}
                        loading="lazy"
                        decoding="async"
                        className="summary-item-thumb"
                      />
                      <span className="summary-item-qty-badge">{item.quantity}</span>
                    </div>

                    <div className="summary-item-meta">
                      <div className="summary-item-name">{itemName}</div>
                      <div className="summary-item-unit-price font-mono">
                        {formatCurrency(item.price, lang)}
                      </div>
                    </div>

                    <div className="summary-item-total font-mono">
                      {formatCurrency(item.price * item.quantity, lang)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Totals Breakdown */}
            <div className="summary-totals-box">
              <div className="summary-total-line">
                <span className="total-label">{t("cart.subtotal")}</span>
                <span className="total-val font-mono">{formatCurrency(cartTotals.subtotal, lang)}</span>
              </div>

              <div className="summary-total-line">
                <span className="total-label">{t("cart.shipping")}</span>
                <span className="total-val shipping-calculated">
                  {t("cart.shippingCalculated")}
                </span>
              </div>

              {cartTotals.discount > 0 && (
                <div className="summary-total-line discount-line">
                  <span className="total-label">{t("cart.discount")}</span>
                  <span className="total-val font-mono">-{formatCurrency(cartTotals.discount, lang)}</span>
                </div>
              )}

              <div className="summary-grand-total-row">
                <div>
                  <span className="grand-total-label">{isAr ? "الإجمالي النهائي" : "Grand Total"}</span>
                  <small className="grand-total-subtext">{isAr ? "(سعر الأجهزة - والشحن يتحدد عند التواصل)" : "(Hardware total - shipping fee confirmed on call)"}</small>
                </div>
                <div className="grand-total-val font-mono">
                  {formatCurrency(cartTotals.grandTotal, lang)}
                </div>
              </div>
            </div>

            {/* Submit CTA Button */}
            <motion.button
              type="submit"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="btn btn-primary btn-checkout-submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="submit-loading-wrap">
                  <span className="btn-spinner" />
                  <span>{isAr ? "جاري تسجيل وتأكيد الطلب..." : "Confirming your order..."}</span>
                </div>
              ) : (
                <div className="submit-content-wrap">
                  <Lock size={18} />
                  <span>
                    {isAr
                      ? `تأكيد الطلب والدفع عند الاستلام (${formatCurrency(cartTotals.grandTotal, "ar")})`
                      : `Confirm COD Order (${formatCurrency(cartTotals.grandTotal, "en")})`}
                  </span>
                </div>
              )}
            </motion.button>

            {/* Trust & Safety Guarantees */}
            <div className="checkout-trust-guarantees">
              <div className="trust-item">
                <ShieldCheck size={17} className="trust-icon" />
                <span>{isAr ? "معاينة وفحص الجهاز قبل الدفع" : "Inspect hardware before payment"}</span>
              </div>
              <div className="trust-item">
                <Truck size={17} className="trust-icon" />
                <span>{isAr ? "شحن وتوصيل لكافة محافظات مصر" : "Fast delivery across all governorates"}</span>
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}

