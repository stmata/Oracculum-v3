import React, { useEffect, useRef } from "react";
import styles from "./Modal.module.css";
export default function Modal({
  open,
  title = "Succès",
  children,
  onClose,
  onConfirm,
  confirmText = "OK",
  showCancel = false,
  cancelText = "Annuler",
  variant = "default",
  size = "auto",
  accentTitle = false,
}) {
  const dialogRef = useRef(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === "Escape") onClose?.(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  const onBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose?.();
  };
  return (
    <div
      className={`${styles.backdrop} ${styles[`variant-${variant}`] || ""}`}
      onClick={onBackdropClick}
    >
      <div
        className={[
          styles.modal,
          styles[`variant-${variant}`] || "",
          styles[`size-${size}`] || "",
          accentTitle ? styles.accentTitle : ""
        ].join(" ")}
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className={styles.header}>
          <h3 id="modal-title" className={styles.title}>{title}</h3>
          <button type="button" className={styles.close} onClick={onClose} aria-label="Fermer">×</button>
        </div>
        <div className={styles.body}>{children}</div>
        <div className={styles.footer}>
          {showCancel && (
            <button className={styles.btnSecondary} onClick={onClose}>{cancelText}</button>
          )}
          <button className={styles.btnPrimary} onClick={onConfirm || onClose}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
