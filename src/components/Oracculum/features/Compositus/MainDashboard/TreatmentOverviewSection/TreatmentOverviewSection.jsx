import React, { useState } from "react";
import styles from "./TreatmentOverviewSection.module.css";
import { LuFileClock, LuFolderClock } from "react-icons/lu";
import { BiStats } from "react-icons/bi";
import { useTranslation } from "../../../../../../utils/useTranslation";
import { useNavigate } from "react-router-dom";
import { useUploadHistory } from "../../../../../../context/UploadHistoryContext";
import { IoCloudDownloadOutline } from "react-icons/io5";

const TreatmentOverviewSection = ({
    renderLast,
    renderHistory,
    renderStats,
    renderReports,
}) => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { error, last } = useUploadHistory();
    const [active, setActive] = useState(null);

    const handleViewResultsClick = () => {
        if (!last) return;
        navigate("/matching-list", {
            state: {
                job_description: last.job_description,
                matches: last.matches,
            },
        });
    };
    const handleNewAnalysis = () => {
        try {
            const raw = sessionStorage.getItem("user") || localStorage.getItem("user");
            const userData = raw ? JSON.parse(raw) : {};
            const updatedUser = { ...userData, first_use: true };
            sessionStorage.setItem("user", JSON.stringify(updatedUser));
        } catch { }
        navigate("/hrfirst");
    };

    const features = [
        {
            id: "last",
            icon: <LuFileClock className={styles.featureIconSvg} aria-hidden="true" />,
            title: t?.("last_analysis"),
            desc: t?.("last_desc"),
            onClick: handleViewResultsClick,
            disabled: !last,
        },
        {
            id: "history",
            icon: <LuFolderClock className={styles.featureIconSvg} aria-hidden="true" />,
            title: t?.("history"),
            desc: t?.("history_desc"),
            path: "/analysis/202",
        },
        {
            id: "stats",
            icon: <BiStats className={styles.featureIconSvg} aria-hidden="true" />,
            title: t?.("global_stats"),
            desc: t?.("stats_desc"),
            path: "/analysis/303",
        },
        {
            id: "reports",
            icon: <IoCloudDownloadOutline className={styles.featureIconSvg} aria-hidden="true" />,
            title: t?.("reports"),
            desc: t?.("reports_desc"),
            path: "/analysis/404",
            disabled: true,
            comingSoon: true
        },
    ];

    return (
        <section className={styles.hero} aria-label={t?.("overview") || "Vue d’ensemble"}>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.leftCard}>
                <h3 className={styles.leftTitle}>
                    {t?.("grow_faster") || "Accélérez vos analyses"} :
                </h3>
                <p className={styles.leftSubtitle}>
                    {t?.("grow_faster_sub") || "Lancez une nouvelle analyse ou explorez vos résultats."}
                </p>

                <button
                    type="button"
                    className={styles.ctaBtn}
                    onClick={handleNewAnalysis}
                    aria-label={t?.("get_started") || "Get Started"}
                >
                    {t?.("new_analysis") || "Nouvelle analyse"}
                </button>

            </div>

            <div className={styles.featuresGrid}>
                {features.map((f) => {
                    const isDisabled = !!f.disabled;
                    return (
                        <button
                            key={f.id}
                            type="button"
                            className={`${styles.featureItem} ${isDisabled ? styles.isDisabled : ""}`}
                            onClick={() => {
                                if (isDisabled) return;
                                if (f.onClick) f.onClick();
                                else if (f.path) navigate(f.path);
                            }}
                            disabled={isDisabled}
                            aria-disabled={isDisabled ? "true" : undefined}
                            title={isDisabled ? (t?.("coming_soon") || "Coming soon") : undefined}
                        >
                            <span className={styles.featureIcon}>{f.icon}</span>
                            <div className={styles.featureBody}>
                                <div className={styles.featureTitle}>
                                    {f.title}
                                    {f.comingSoon && (
                                        <span className={styles.pillSoon}>
                                            {t?.("soon") || "SOON"}
                                        </span>
                                    )}
                                </div>
                                <div className={styles.featureDesc}>{f.desc}</div>
                            </div>
                        </button>
                    );
                })}
            </div>


            <div className={styles.dynamicPane}>
                {active === "last" && (renderLast ? renderLast() : null)}
                {active === "history" && (renderHistory ? renderHistory() : null)}
                {active === "stats" && (renderStats ? renderStats() : null)}
                {active === "reports" && (renderReports ? renderReports() : null)}
            </div>

        </section>

    );
};

export default TreatmentOverviewSection;
