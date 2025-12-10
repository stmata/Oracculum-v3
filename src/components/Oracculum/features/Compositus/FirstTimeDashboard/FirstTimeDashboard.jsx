import React, { useState, useEffect } from 'react';
import styles from './FirstTimeDashboard.module.css';
import { FaUpload, FaFileAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import HowItWorksModal from '../HowItWorksModal/HowItWorksModal';
import { useTranslation } from '../../../../../utils/useTranslation';

const FirstTimeDashboard = () => {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
      const userData = raw ? JSON.parse(raw) : {};
      const updatedUser = { ...userData, first_use: false };

      sessionStorage.setItem("user", JSON.stringify(updatedUser));
    } catch (e) {
      console.error("Failed to update first_use flag", e);
    }
  }, []);

  const handleUploadClick = () => navigate('/upload');
  const handleManualClick = () => navigate('/prompt');
  const handleHowItWorks = () => setShowModal(true);

  return (
    <div className={styles.shell}>
      <div className={styles.bgGradient} aria-hidden="true" />

      <div className={styles.grid}>
        <section className={styles.cardPrimary}>
          <button
            className={styles.backButton}
            onClick={() => navigate(-1)}  
          >
            ← Retour
          </button>

          <header className={styles.header}>
            <h1 className={styles.title}>
              {t('ftd_welcome')}{' '}
              <span className={styles.brand}>CompositusHR</span>
            </h1>
            <p className={styles.subtitle}>{t('ftd_subtitle')}</p>
          </header>

          <p className={styles.helper}>{t('ftd_choose_start')}</p>

          <div className={styles.actions}>
            <button
              className={`${styles.btn} ${styles.btnPrimary}`}
              onClick={handleUploadClick}
            >
              <FaUpload aria-hidden="true" className={styles.btnIcon} />
              <span>{t('ftd_upload_file')}</span>
            </button>

            <button
              className={`${styles.btn} ${styles.btnPrimary} ${styles.btnDisabled}`}
              disabled
            >
              <FaFileAlt aria-hidden="true" className={styles.btnIcon} />
              <span>
                {t('ftd_enter_manually')}{' '}
                <em className={styles.soonTag}>({t('coming_soon')})</em>
              </span>
            </button>
          </div>

          <div className={styles.helperRow}>
            <button className={styles.linkBtn} onClick={handleHowItWorks}>
              {t('ftd_how_it_works')}
            </button>
          </div>
        </section>

        <aside className={styles.cardSecondary}>
          <div className={styles.illustrationWrap}>
            <img
              src="https://media0.giphy.com/media/v1.Y2lkPTc5MGI3NjExODZ3a2c5bjM0eWphYWd2dWN1N3gyZTE1MzVjemV6emg2dTg4YzlweCZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9cw/Ja7EbBCq3NQViTnNii/giphy.gif"
              alt={t('ftd_ai_animation_alt')}
              className={styles.illustration}
            />
          </div>

          <p className={styles.kicker}>{t('ftd_ready')}</p>

          <ul className={styles.checklist} role="list">
            <li className={styles.checkLine}>{t('ftd_bullet_instant')}</li>
            <li className={styles.checkLine}>{t('ftd_bullet_suggestions')}</li>
            <li className={styles.checkLine}>{t('ftd_bullet_streamlined')}</li>
            <li className={styles.checkLine}>{t('ftd_bullet_save_time')}</li>
          </ul>
        </aside>
      </div>

      {showModal && <HowItWorksModal onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default FirstTimeDashboard;
