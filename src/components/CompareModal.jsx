import React, { useState } from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { ArrowLeftRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { formatCurrency } from "../data/storeData";

export default function CompareModal() {
  const { compareList = [], toggleCompare, clearCompare, isCompareOpen, setIsCompareOpen, addToCart, products = [] } = useStore();
  const { t, lang } = useLanguage();
  const [highlightDifferences, setHighlightDifferences] = useState(false);

  const prods = compareList.map((id) => products.find((p) => p.id?.toString() === id?.toString())).filter(Boolean);

  if (compareList.length === 0 && !isCompareOpen) return null;

  // Build spec keys set
  const allSpecSections = {};
  prods.forEach((p) => {
    if (p.specs) {
      Object.keys(p.specs).forEach((sec) => {
        if (!allSpecSections[sec]) allSpecSections[sec] = new Set();
        Object.keys(p.specs[sec]).forEach((k) => allSpecSections[sec].add(k));
      });
    }
  });

  return (
    <>
      {/* Floating Bottom Tray */}
      {compareList.length > 0 && !isCompareOpen && (
        <motion.div
          initial={{ y: 100 }}
          animate={{ y: 0 }}
          exit={{ y: 100 }}
          className="compare-tray open"
        >
          <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "var(--powder-blue)", display: "flex", alignItems: "center", gap: 6 }}>
            <ArrowLeftRight size={18} /> {t("compare.tray", { count: compareList.length })}
          </div>
          <div className="compare-items-list">
            {prods.map((p) => (
              <div key={p.id} className="compare-item-chip">
                <span>{p.name}</span>
                <X size={14} style={{ cursor: "pointer" }} onClick={() => toggleCompare(p.id)} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button onClick={() => setIsCompareOpen(true)} className="btn btn-primary btn-sm">
              {t("compare.viewMatrix")}
            </button>
            <button
              onClick={clearCompare}
              className="btn btn-outline btn-sm"
              style={{ color: "#fff", borderColor: "rgba(255,255,255,0.3)" }}
            >
              {t("compare.clear")}
            </button>
          </div>
        </motion.div>
      )}

      {/* Side-by-Side Modal */}
      <AnimatePresence>
        {isCompareOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="compare-modal-backdrop open"
            onClick={(e) => {
              if (e.target === e.currentTarget) setIsCompareOpen(false);
            }}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              transition={{ type: "spring", stiffness: 340, damping: 28 }}
              className="compare-modal-content"
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", paddingBottom: "1rem", borderBottom: "1px solid var(--border-light)" }}>
                <div>
                  <h2 style={{ fontSize: "1.75rem", color: "var(--prussian-blue)" }}>{t("compare.title")}</h2>
                  <p style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>{t("compare.subtitle")}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.85rem", fontWeight: 600, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={highlightDifferences}
                      onChange={(e) => setHighlightDifferences(e.target.checked)}
                    />
                    {t("compare.highlight")}
                  </label>
                  <button onClick={() => setIsCompareOpen(false)} className="btn btn-outline btn-sm">
                    {t("compare.close")}
                  </button>
                </div>
              </div>

              {prods.length === 0 ? (
                <div style={{ textAlign: "center", padding: "3rem" }}>
                  <p>{t("compare.empty")}</p>
                </div>
              ) : (
                <table className="compare-modal-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "20%", padding: "1rem", textAlign: "left", background: "var(--alice-blue)", border: "1px solid var(--border-light)" }}>
                        {t("compare.feature")}
                      </th>
                      {prods.map((p) => (
                        <th
                          key={p.id}
                          style={{
                            padding: "1rem",
                            textAlign: "center",
                            background: "var(--alice-blue)",
                            border: "1px solid var(--border-light)",
                            width: `${80 / prods.length}%`
                          }}
                        >
                          <img src={p.image} alt={p.name} style={{ height: 90, objectFit: "contain", marginBottom: "0.5rem" }} />
                          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--prussian-blue)" }}>{p.name}</div>
                          <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--blue-bell)", marginTop: 4 }}>
                            {formatCurrency(p.price, lang)}
                          </div>
                          <button
                            onClick={() => {
                              addToCart(p.id);
                              setIsCompareOpen(false);
                            }}
                            className="btn btn-primary btn-sm"
                            style={{ marginTop: "0.5rem" }}
                          >
                            {t("compare.addToCart")}
                          </button>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.keys(allSpecSections).map((secName) => (
                      <React.Fragment key={secName}>
                        <tr>
                          <td
                            colSpan={prods.length + 1}
                            style={{ background: "var(--prussian-blue)", color: "#fff", fontWeight: 700, padding: "0.6rem 1rem", fontSize: "0.9rem" }}
                          >
                            {secName}
                          </td>
                        </tr>
                        {Array.from(allSpecSections[secName]).map((key) => {
                          const values = prods.map((p) => (p.specs && p.specs[secName] && p.specs[secName][key] ? p.specs[secName][key] : "—"));
                          const isDifferent = new Set(values).size > 1;

                          if (highlightDifferences && !isDifferent) return null;

                          return (
                            <tr key={key} style={{ background: isDifferent && highlightDifferences ? "rgba(235, 131, 141, 0.15)" : "transparent" }}>
                              <td style={{ padding: "0.75rem 1rem", border: "1px solid var(--border-light)", fontWeight: 600, fontSize: "0.85rem", color: "var(--text-muted)" }}>
                                {key}
                              </td>
                              {values.map((val, idx) => {
                                const isBoolTrue = typeof val === "boolean" ? val : String(val).toLowerCase() === "yes" || String(val).toLowerCase() === "true";
                                const isBoolFalse = typeof val === "boolean" ? !val : String(val).toLowerCase() === "no" || String(val).toLowerCase() === "false" || val === "—";
                                return (
                                  <td key={idx} className="spec-mono" style={{ padding: "0.75rem 1rem", border: "1px solid var(--border-light)", textAlign: "center", fontSize: "0.85rem", color: "var(--text-main)" }}>
                                    {isBoolTrue ? (
                                      <span style={{ color: "var(--color-success)", fontWeight: 700 }}>✓</span>
                                    ) : isBoolFalse && (val === "—" || typeof val === "boolean") ? (
                                      <span style={{ color: "var(--text-muted)" }}>—</span>
                                    ) : (
                                      val
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
