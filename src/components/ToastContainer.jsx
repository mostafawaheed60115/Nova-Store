import React from "react";
import { useStore } from "../context/StoreContext";
import { useLanguage } from "../context/LanguageContext";
import { CheckCircle2, Info, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ToastContainer() {
  const { toasts } = useStore();
  const { dir } = useLanguage();
  const xOffset = dir === "rtl" ? -40 : 40;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: xOffset, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: xOffset, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 450, damping: 28 }}
            className={`toast-msg ${toast.type}`}
            role="status"
          >
            {toast.type === "error" ? (
              <AlertCircle size={18} color="var(--light-coral)" />
            ) : toast.type === "info" || toast.type === "delete" ? (
              <Info size={18} color="var(--blue-bell)" />
            ) : (
              <CheckCircle2 size={18} color="var(--blue-bell)" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
