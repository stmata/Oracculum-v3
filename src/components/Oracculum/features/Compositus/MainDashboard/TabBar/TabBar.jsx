import React, { useEffect, useMemo, useState } from "react";
import styles from "./TabBar.module.css";
import { useTranslation } from "../../../../../../utils/useTranslation";
import { FaHistory, FaUsersCog } from "react-icons/fa";
import { TbChartHistogram } from "react-icons/tb";
import { BiCustomize } from "react-icons/bi";

const TabBar = ({ active, defaultActive = "treatment", onChange, storageKey = "tabbar:last" }) => {
  const { t } = useTranslation();

  const load = () => {
    try {
      const v = localStorage.getItem(storageKey);
      return v || null;
    } catch {
      return null;
    }
  };

  const save = (v) => {
    try {
      localStorage.setItem(storageKey, v);
    } catch { }
  };

  const [inner, setInner] = useState(() => load() || defaultActive);

  const current = active ?? inner;

  const tabs = useMemo(
    () => [
      { id: "candidates", label: t("tab_candidates", "Candidats"), icon: <FaUsersCog /> },
      { id: "treatment", label: t("tab_treatment", "Traitement"), icon: <FaHistory /> },
      { id: "certificats", label: t("tab_certificats", "Certificates"), icon: <BiCustomize /> },
      { id: "analytics", label: t("tab_analytics", "Analytique"), icon: <TbChartHistogram /> },
    ],
    [t]
  );

  useEffect(() => {
    if (active != null) return;
    const saved = load();
    if (saved) setInner(saved);
  }, [active]);

  useEffect(() => {
    if (current) save(current);
  }, [current]);

  const handleClick = (id) => {
    save(id);
    onChange?.(id);

    if (active == null) {
      setInner(id);
    }
  };
  return (
    <div className={styles.tabBarFixed}>
      <div className={styles.tabGroup}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`${styles.tabBtn} ${current === tab.id ? styles.tabBtnActive : ""}`}
            onClick={() => handleClick(tab.id)}
            aria-current={current === tab.id ? "page" : undefined}
          >
            <span className={styles.icon}>{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default TabBar;
