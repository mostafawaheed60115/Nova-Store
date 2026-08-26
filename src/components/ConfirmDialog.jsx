import React, { useEffect, useRef } from "react";
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
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const onCancelRef = useRef(onCancel);
  const isLoadingRef = useRef(isLoading);
  onCancelRef.current = onCancel;
  isLoadingRef.current = isLoading;

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousFocus = document.activeElement;
    const frame = window.requestAnimationFrame(() => cancelRef.current?.focus());
    const handleKeyDown = (event) => {
      if (event.key === "Escape" && !isLoadingRef.current) {
        event.preventDefault();
        onCancelRef.current?.();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = dialogRef.current?.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="confirm-modal-overlay" onClick={isLoading ? undefined : onCancel}>
        <motion.div
          ref={dialogRef}
          className={`confirm-dialog-card ${variant}`}
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="confirm-dialog-title"
          aria-describedby="confirm-dialog-message"
          aria-busy={isLoading}
          initial={{ opacity: 0, scale: 0.92, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 15 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          onClick={(e) => e.stopPropagation()}
        >
          <button type="button" className="confirm-close-btn" onClick={onCancel} aria-label="Close dialog" disabled={isLoading}>
            <X size={18} />
          </button>

          <div className="confirm-dialog-icon">
            {variant === "danger" ? (
              <AlertCircle size={28} color="#EB838D" />
            ) : (
              <AlertTriangle size={28} color="#D69A4A" />
            )}
          </div>

          <h3 id="confirm-dialog-title" className="confirm-dialog-title">{title}</h3>
          <p id="confirm-dialog-message" className="confirm-dialog-message">{message}</p>

          <div className="confirm-dialog-actions">
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={onCancel}
              disabled={isLoading}
              ref={cancelRef}
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
