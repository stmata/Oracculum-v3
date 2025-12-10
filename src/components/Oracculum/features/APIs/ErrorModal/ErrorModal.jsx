import React, { useContext } from 'react';
import styles from './ErrorModal.module.css';
import { ThemeContext } from '../../../../../context/ThemeContext';
import { useTranslation } from "../../../../../utils/useTranslation";


const ErrorModal = ({ isOpen, message, onClose }) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';
    const { t } = useTranslation();
    if (!isOpen) return null;

    return (
        <div
            className={`
        ${styles.overlay}
        ${isDark ? styles.darkOverlay : ''}
      `}
            onClick={onClose}
        >
            <div
                className={`
          ${styles.modal}
          ${isDark ? styles.darkModal : ''}
        `}
                onClick={e => e.stopPropagation()}
            >
                <button
                    className={`
            ${styles.closeButton}
            ${isDark ? styles.darkCloseButton : ''}
          `}
                    onClick={onClose}
                >
                    ×
                </button>

                <div className={styles.content}>
                    <h2
                        className={`
              ${styles.title}
              ${isDark ? styles.darkTitle : ''}
            `}
                    >
                        {t("error")}          </h2>
                    <p
                        className={`
              ${styles.message}
              ${isDark ? styles.darkMessage : ''}
            `}
                    >
                        {message}
                    </p>
                </div>

                <div className={styles.actions}>
                    <button
                        className={`
              ${styles.okButton}
              ${isDark ? styles.darkOkButton : ''}
            `}
                        onClick={onClose}
                    >
                        OK
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ErrorModal;
