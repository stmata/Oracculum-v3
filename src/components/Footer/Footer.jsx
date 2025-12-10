import React from 'react';
import styles from './Footer.module.css';
import { useTranslation } from "../../utils/useTranslation";

const Footer = () => {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      © {year} {t("footer_text")}
    </footer>
  );
};

export default Footer;
