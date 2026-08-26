import React, { useState, useRef, useEffect, Component } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import {
  Sparkles,
  X,
  Send,
  ShoppingBag,
  ArrowRight,
  Bot,
  User,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

/* ─── Error Boundary ─── */
class AiErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, info) {
    console.error("[AiAssistant] Crash:", error, info);
  }
  render() {
    if (this.state.hasError) {
      return (
        <button
          style={{
            position: "fixed",
            bottom: "2rem",
            right: "2rem",
            zIndex: 9990,
            padding: "0.85rem 1.25rem",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #162944 0%, #3399D4 100%)",
            color: "#fff",
            border: "1px solid rgba(255,255,255,0.25)",
            cursor: "pointer",
            fontWeight: 700,
            fontSize: "0.95rem",
            boxShadow: "0 8px 24px rgba(22,41,68,0.35)",
          }}
          onClick={() => this.setState({ hasError: false, error: null })}
        >
          <Sparkles size={22} color="#ffffff" />
          <span style={{ marginInlineStart: "0.5rem" }}>Retry AI</span>
        </button>
      );
    }
    return this.props.children;
  }
}

/* ─── Main Component ─── */
function AiAssistantInner() {
  const { navigateTo, addToCart, products = [] } = useStore();
  const { t, lang } = useLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const chatEndRef = useRef(null);

  /* Initialize intro message once language is available */
  useEffect(() => {
    setMessages([
      {
        id: "intro",
        sender: "ai",
        text: t("ai.messages.intro"),
        products: [],
      },
    ]);
  }, [lang, t]);

  /* Auto scroll chat to bottom when messages change */
  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen, isTyping]);

  /* Match products and craft response */
  const processUserQuery = (query) => {
    const qLower = query.toLowerCase();
    let matches = [];
    let responseText = "";

    // Extract price condition if present (e.g. "under 1000" or "under $1000")
    const priceMatch = qLower.match(/under\s*\$?(\d+)/i) || qLower.match(/أقل\s*من\s*\$?(\d+)/i);
    const maxP = priceMatch ? parseInt(priceMatch[1], 10) : null;

    if (qLower.includes("laptop") || qLower.includes("لابتوب")) {
      matches = products.filter((p) => (p.category && p.category.includes("laptop")) || (p.name && p.name.toLowerCase().includes("laptop")));
      responseText =
        lang === "ar"
          ? "إليك أفضل أجهزة اللابتوب فائقة الأداء المتاحة لدينا للعمل والألعاب وتعديل الفيديو:"
          : "Here are our top-performing laptops for gaming, creative work, and mobile productivity:";
    } else if (
      qLower.includes("monitor") ||
      qLower.includes("screen") ||
      qLower.includes("شاشة") ||
      qLower.includes("شاشات")
    ) {
      matches = products.filter((p) => (p.category && p.category.includes("monitor")) || (p.name && p.name.toLowerCase().includes("monitor")));
      responseText =
        lang === "ar"
          ? "تفضل أفضل الشاشات المتاحة بدقة 4K ومعدل تحديث عالي للتصاميم والألعاب:"
          : "Here are our top rated 4K OLED & High-Refresh gaming displays:";
    } else if (
      qLower.includes("pc") ||
      qLower.includes("rig") ||
      qLower.includes("desktop") ||
      qLower.includes("حاسوب") ||
      qLower.includes("كمبيوتر")
    ) {
      matches = products.filter((p) => (p.category && p.category.includes("bundle")) || (p.category && p.category.includes("pc")));
      responseText =
        lang === "ar"
          ? "إليك أقوى تجميعات الحاسوب الجاهزة والمبرّدة بالسائل:"
          : "Check out our extreme liquid-cooled battlestations and workstations:";
    } else if (
      qLower.includes("keyboard") ||
      qLower.includes("mouse") ||
      qLower.includes("headphone") ||
      qLower.includes("gear") ||
      qLower.includes("لوحة") ||
      qLower.includes("سماعة")
    ) {
      matches = products.filter((p) => p.category === "accessories" || (p.name && p.name.toLowerCase().includes("keyboard")));
      responseText =
        lang === "ar"
          ? "إليك أفضل الملحقات والطرفيات الاحترافية المتاحة:"
          : "Here is our flagship mechanical gear and studio audio equipment:";
    } else {
      // General product keyword search
      matches = products.filter(
        (p) =>
          (p.name && p.name.toLowerCase().includes(qLower)) ||
          (p.nameAr && p.nameAr.toLowerCase().includes(qLower)) ||
          (p.description && p.description.toLowerCase().includes(qLower)) ||
          (p.category && p.category.toLowerCase().includes(qLower))
      );
      if (matches.length > 0) {
        responseText =
          lang === "ar"
            ? `بناءً على طلبك، وجدنا هذه المنتجات المناسبة لك:`
            : `Based on your request, I recommend these top matches from our catalog:`;
      } else {
        matches = products.slice(0, 3);
        responseText =
          lang === "ar"
            ? "لم أجد تطابقاً دقيقاً، لكن إليك أبرز المنتجات الأكثر مبيعاً لدينا والتي قد تهمك:"
            : "I couldn't find an exact match for that keyword, but here are our top featured bestsellers:";
      }
    }

    if (maxP) {
      matches = matches.filter((p) => (p.price || 0) <= maxP);
      if (matches.length === 0) {
        matches = products.filter((p) => (p.price || 0) <= maxP);
      }
    }

    return { responseText, recommendedProducts: matches.slice(0, 3) };
  };

  const handleSend = (textToSend = inputVal) => {
    const q = textToSend.trim();
    if (!q) return;

    const userMsg = { id: Date.now(), sender: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setInputVal("");
    setIsTyping(true);

    setTimeout(() => {
      const { responseText, recommendedProducts } = processUserQuery(q);
      const aiMsg = {
        id: Date.now() + 1,
        sender: "ai",
        text: responseText,
        products: recommendedProducts,
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <>
      {/* Floating Widget Launcher Button */}
      <motion.button
        className="ai-assistant-launcher"
        onClick={() => setIsOpen((prev) => !prev)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        title={t("ai.open")}
        aria-label={t("ai.open")}
        style={{
          position: "fixed",
          bottom: "2rem",
          right: "2rem",
          zIndex: 9990,
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          background: "linear-gradient(135deg, #162944 0%, #3399D4 100%)",
          color: "#ffffff",
          padding: "0.85rem 1.25rem",
          borderRadius: "999px",
          boxShadow: "0 8px 24px rgba(22,41,68,0.35)",
          fontWeight: 700,
          fontSize: "0.95rem",
          cursor: "pointer",
          border: "1px solid rgba(255,255,255,0.25)",
        }}
      >
        <Sparkles size={22} color="#ffffff" />
        <span className="launcher-text desktop-only">{t("ai.open")}</span>
      </motion.button>

      {/* Floating Chat Window Drawer */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="ai-assistant-card"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed",
              bottom: "5.5rem",
              right: "2rem",
              zIndex: 9995,
              width: "380px",
              maxWidth: "calc(100vw - 2rem)",
              height: "540px",
              maxHeight: "calc(100vh - 7rem)",
              background: "#ffffff",
              borderRadius: "20px",
              boxShadow: "0 16px 48px rgba(22,41,68,0.35)",
              border: "1px solid #d0d7de",
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            {/* Header */}
            <div className="ai-card-header" style={{
              background: "linear-gradient(135deg, #162944 0%, #1c3558 100%)",
              color: "#ffffff",
              padding: "1rem 1.25rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}>
              <div className="ai-header-title-box" style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <div className="ai-avatar-icon" style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "#3399D4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  boxShadow: "0 0 12px rgba(51,153,212,0.4)",
                }}>
                  <Bot size={20} color="#ffffff" />
                </div>
                <div>
                  <h4 className="ai-header-name" style={{ fontSize: "1.05rem", fontWeight: 700, color: "#ffffff", margin: 0 }}>{t("ai.header")}</h4>
                  <span className="ai-status-tag" style={{ fontSize: "0.72rem", color: "#B8C7DD", display: "block" }}>Online • Nova AI v2.5</span>
                </div>
              </div>
              <button
                className="ai-close-btn"
                onClick={() => setIsOpen(false)}
                aria-label={t("ai.close")}
                style={{
                  color: "rgba(255,255,255,0.75)",
                  padding: "4px",
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: "none",
                  border: "none",
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Subtitle Bar */}
            <div className="ai-subtitle-bar" style={{
              background: "#EAF1F9",
              color: "#162944",
              padding: "0.5rem 1rem",
              fontSize: "0.78rem",
              fontWeight: 600,
              borderBottom: "1px solid #e0e0e0",
              flexShrink: 0,
            }}>{t("ai.subtitle")}</div>

            {/* Message History */}
            <div className="ai-messages-body" style={{
              flex: 1,
              overflowY: "auto",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "1rem",
              background: "#fbfcfd",
            }}>
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`ai-message-row ${m.sender === "user" ? "user-row" : "ai-row"}`}
                >
                  {m.sender === "ai" && (
                    <div className="msg-avatar ai-avatar">
                      <Sparkles size={14} color="#3399D4" />
                    </div>
                  )}

                  <div className="msg-content-wrapper">
                    <div className={`msg-bubble ${m.sender}`}>
                      {m.text}
                    </div>

                    {/* Inline Product Recommendations */}
                    {m.products && m.products.length > 0 && (
                      <div className="ai-recommended-grid">
                        {m.products.map((prod) => (
                          <div key={prod.id} className="ai-product-card">
                            <img
                              src={prod.image}
                              alt={prod.name}
                              className="ai-prod-img"
                            />
                            <div className="ai-prod-details">
                              <div className="ai-prod-name">{prod.name}</div>
                              <div className="ai-prod-price">
                                ${prod.price.toLocaleString()}
                              </div>
                            </div>
                            <div className="ai-prod-actions">
                              <button
                                className="ai-btn-view"
                                onClick={() => {
                                  navigateTo("product", { id: prod.id });
                                  setIsOpen(false);
                                }}
                              >
                                {t("hero.explore")} <ArrowRight size={12} />
                              </button>
                              <button
                                className="ai-btn-cart"
                                onClick={() => addToCart(prod.id)}
                                title="Add to Cart"
                              >
                                <ShoppingBag size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {m.sender === "user" && (
                    <div className="msg-avatar user-avatar">
                      <User size={14} color="#ffffff" />
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="ai-message-row ai-row">
                  <div className="msg-avatar ai-avatar">
                    <Sparkles size={14} color="#3399D4" />
                  </div>
                  <div className="msg-bubble ai typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Suggestion Chips */}
            <div className="ai-suggestions-bar" style={{
              display: "flex",
              gap: "0.5rem",
              padding: "0.6rem 0.85rem",
              overflowX: "auto",
              background: "#EAF1F9",
              borderTop: "1px solid #e0e0e0",
              flexShrink: 0,
            }}>
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  className="ai-chip-btn"
                  onClick={() => handleSend(s)}
                  style={{
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    color: "#162944",
                    background: "#ffffff",
                    border: "1px solid #B8C7DD",
                    padding: "5px 12px",
                    borderRadius: "999px",
                    cursor: "pointer",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* Input Box */}
            <form
              className="ai-input-form"
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              noValidate
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1rem",
                background: "#ffffff",
                borderTop: "1px solid #e0e0e0",
                flexShrink: 0,
              }}
            >
              <input
                type="text"
                className="ai-chat-input"
                placeholder={t("ai.placeholder")}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                style={{
                  flex: 1,
                  border: "1px solid #e0e0e0",
                  borderRadius: "999px",
                  padding: "0.6rem 1rem",
                  fontSize: "0.875rem",
                  fontFamily: "inherit",
                  outline: "none",
                  background: "#ffffff",
                  color: "#162944",
                }}
              />
              <button
                type="submit"
                className="ai-send-btn"
                disabled={!inputVal.trim()}
                aria-label={t("ai.send")}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: inputVal.trim() ? "#3399D4" : "#76A4C4",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "none",
                  cursor: inputVal.trim() ? "pointer" : "not-allowed",
                  flexShrink: 0,
                  opacity: inputVal.trim() ? 1 : 0.5,
                }}
              >
                <Send size={16} />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default function AiAssistant() {
  return (
    <AiErrorBoundary>
      <AiAssistantInner />
    </AiErrorBoundary>
  );
}
