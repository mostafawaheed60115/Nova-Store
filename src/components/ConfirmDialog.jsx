import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, AlertCircle, X } from "lucide-react";

export default function ConfirmDialog({
  isOpen,
  title = "Are you sure?",
  message = "This action cannot be undone.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'info'
  isLoading = false,
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="confirm-modal-overlay" onClick={onCancel}>
        <motion.div
          className={`confirm-dialog-card ${variant}`}
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button className="confirm-close-btn" onClick={onCancel} aria-label="Close dialog">
            <X size={18} />
          </button>

          <div className="confirm-dialog-icon">
            {variant === "danger" ? (
              <AlertCircle size={28} color="#EB838D" />
            ) : (
              <AlertTriangle size={28} color="#D69A4A" />
            )}
          </div>

          <h3 className="confirm-dialog-title">{title}</h3>
          <p className="confirm-dialog-message">{message}</p>

          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onCancel}
              disabled={isLoading}
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              className={`btn ${variant === "danger" ? "btn-danger" : "btn-primary"} btn-sm`}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Processing..." : confirmLabel}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
