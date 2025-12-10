import React, { useEffect } from "react";
import styles from "./ConfirmModal.module.css";

const ConfirmModal = ({
    open,
    title = "Confirmer",
    message = "Es-tu sûr(e) ?",
    confirmText = "Supprimer",
    cancelText = "Annuler",
    onConfirm,
    onCancel,
    loading = false,
    loadingText,
    danger = false,
}) => {
    useEffect(() => {
        if (!open || loading) return;
        const onKey = (e) => { if (e.key === "Escape") onCancel?.(); };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [open, loading, onCancel]);

    if (!open) return null;

    return (
        <div
            className={styles.backdrop}
            onClick={loading ? undefined : onCancel}
            role="dialog"
            aria-modal="true"
            aria-busy={loading ? "true" : "false"}
        >
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h3 className={styles.title}>{title}</h3>
                    {!loading && (
                        <button className={styles.close} onClick={onCancel} aria-label="Close">×</button>
                    )}
                </div>

                <div className={styles.body}>
                    <p style={{ whiteSpace: "pre-line" }}>{message}</p>
                </div>

                <div className={styles.footer}>
                    {loading ? (
                        <div className={styles.footerLoading}>
                            <div className={styles.spinner} />
                        </div>
                    ) : (
                        <>
                            <button
                                className={styles.btnSecondary}
                                onClick={onCancel}
                            >
                                {cancelText}
                            </button>
                            <button
                                className={`${styles.btnPrimary} ${danger ? styles.danger : ""}`}
                                onClick={onConfirm}
                            >
                                {confirmText}
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConfirmModal;
