import React from "react";
import styles from "./Analytics.module.css";
import { useTranslation } from "../../../../../../utils/useTranslation";

const Analytics = () => {
  const { t } = useTranslation();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.title}>{t("analytics_title", "Analytics")}</h1>

        <p className={styles.subtitle}>
          {t("analytics_coming_soon", "Bientôt disponible")}
        </p>

        <p className={styles.text}>
          {t(
            "analytics_description",
            "Cette fonctionnalité est en préparation et sera ajoutée dans une prochaine mise à jour."
          )}
        </p>
      </div>
    </div>
  );
};

export default Analytics;
