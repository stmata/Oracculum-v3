import React, { useMemo } from "react";
import styles from "./TopStats.module.css";
import ProgressRing from "../ProgressRing/ProgressRing";
import { useTranslation } from "../../../../../../../../../utils/useTranslation";

function normalizeTo100(items) {
  const total = items.reduce((s, i) => s + (i.count || 0), 0);
  if (total === 0) return items.map((i) => ({ ...i, pct: 0 }));

  const floats = items.map((i) => ({
    ...i,
    pctRaw: (i.count / total) * 100,
    pct: Math.floor((i.count / total) * 100),
  }));
  let sum = floats.reduce((a, b) => a + b.pct, 0);
  let remainder = 100 - sum;
  const sorted = [...floats].sort(
    (a, b) => b.pctRaw - Math.floor(b.pctRaw) - (a.pctRaw - Math.floor(a.pctRaw))
  );
  for (let i = 0; i < Math.abs(remainder); i++) {
    sorted[i % sorted.length].pct += Math.sign(remainder);
  }
  return floats.map((i) => ({
    ...i,
    pct: sorted.find((s) => s.label === i.label)?.pct ?? i.pct,
  }));
}

export default function TopStats({ stats = {}, loading }) {
  const { t } = useTranslation();

  const data = useMemo(() => {
    const rows = [
      {
        key: "EAP_Professeurs",
        label: t("dashboard_source_professors", "Professeurs"),
        count: stats.EAP_Professeurs || 0,
      },
      {
        key: "EAP_Administratif",
        label: t("dashboard_source_administrative", "Administratif"),
        count: stats.EAP_Administratif || 0,
      },
      {
        key: "EAP_EntretiensProfessionnels",
        label: t("dashboard_source_interviews", "Entretiens"),
        count: stats.EAP_EntretiensProfessionnels || 0,
      },
      {
        key: "Vacataires",
        label: t("dashboard_source_vacataires", "Vacataires"),
        count: stats.Vacataires || 0,
      },
    ];
    return normalizeTo100(rows);
  }, [stats, t]);

  const internes = data.slice(0, 3);
  const externes = data.slice(3);

  const totalInterne = internes.reduce((s, i) => s + i.count, 0);
  const totalExterne = externes.reduce((s, i) => s + i.count, 0);

  return (
    <div className={styles.wrap}>
      <div className={styles.item} >
        <div className={styles.totalCol}>
          <div className={styles.total}>{totalInterne}</div>
        </div>

        <div className={styles.title}>{t("source_internal", "Interne")}</div>

        <div className={styles.metrics}>
          {internes.map((r) => (
            <div key={r.key} className={styles.metric}>
              <div className={styles.metricLabel}>{r.label}</div>
              <div className={styles.metricValue}>{r.count}</div>
              <div className={styles.ring}>
                <ProgressRing
                  size={60}
                  stroke={5}
                  progress={loading ? 0 : r.pct}
                  text={`${loading ? 0 : r.pct}%`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.item2} >
        <div className={styles.total2}>{totalExterne}</div>
        <div className={styles.singleCompact2}>
          <div className={styles.title2}>{t("source_external", "Externe")}</div>
          <div className={styles.ring2}>
            <ProgressRing
              size={60}
              stroke={5}
              progress={loading ? 0 : externes[0]?.pct || 0}
              text={`${loading ? 0 : externes[0]?.pct || 0}%`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
