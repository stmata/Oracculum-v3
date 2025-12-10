import React, { useEffect, useState } from "react";
import styles from "./MainDashboard.module.css";
import { useTranslation } from "../../../../../utils/useTranslation";
import TabBar from "./TabBar/TabBar";
import TreatmentOverviewSection from "./TreatmentOverviewSection/TreatmentOverviewSection";
import CandidatesDashboard from "./CandidatesDashboard/CandidatesDashboard";
import Analytics from "./Analytics/Analytics";
import CertificatesHome from "./Certificates/CertificatesHome";

const STORAGE_KEY = "mainDashboard:lastTab";

const MainDashboard = () => {
  const { t } = useTranslation();

  const [active, setActive] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "treatment";
    } catch {
      return "treatment";
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, active);
    } catch { }
  }, [active]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.featureHeader}>
        <p className={styles.kicker}>
          {t("dashboard_kicker", "WHAT SETS US APART")}
        </p>
        <h2 className={styles.featureTitle}>
          {t("dashboard_title", "Features")} :
        </h2>
        <p className={styles.featureSub}>
          {t(
            "dashboard_subtitle",
            "Choisissez ce dont vous avez besoin : historique de traitement, gestion des candidats, analytics puissants ou personnalisation."
          )}
        </p>
      </div>

      <TabBar active={active} onChange={setActive} />

      <div style={{ marginTop: "20px" }}>
        {active === "treatment" && <TreatmentOverviewSection />}
        {active === "candidates" && <CandidatesDashboard />}
        {active === "analytics" && <Analytics />}
        {active === "certificats" && <CertificatesHome />}
      </div>
    </div>
  );
};

export default MainDashboard;
