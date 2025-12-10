import React from 'react';
import styles from './HowItWorksModal.module.css';
import { useTranslation } from '../../../../../utils/useTranslation';

const HowItWorksModal = ({ onClose }) => {
    const { t } = useTranslation();

    const handleOverlayClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    return (
        <div className={styles.overlay} onClick={handleOverlayClick}>
            <div className={styles.modal}>
                <button className={styles.closeButton} onClick={onClose}>×</button>

                <h2 className={styles.title}>
                    {t('hiw_title_pre')} <strong>CompositusHR</strong> {t('hiw_title_post')}
                </h2>
                <p className={styles.text}>{t('hiw_p1')}</p>
                <p className={styles.text}>{t('hiw_p2')}</p>
                <p className={styles.text}>{t('hiw_p3')}</p>
                <p className={styles.text}>{t('hiw_p4')}</p>
            </div>
        </div>
    );
};

export default HowItWorksModal;
