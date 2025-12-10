import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadHistory } from "../../../../../../../../context/UploadHistoryContext";
import { useTranslation } from "../../../../../../../../utils/useTranslation";
import styles from "./StatsPage.module.css";
import { LuArrowRight } from "react-icons/lu";

const StatsPage = () => {
    const { history, counts, loading, error } = useUploadHistory();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const fileCount = useMemo(
        () => (history || []).filter((h) => h.doc_type === "file").length,
        [history]
    );
    const promptCount = useMemo(
        () => (history || []).filter((h) => h.doc_type === "prompt").length,
        [history]
    );
    const interneCount = useMemo(
        () =>
            (history || []).filter(
                (h) =>
                    h.candidate_source === "internal" ||
                    h.candidate_source === "all"
            ).length,
        [history]
    );

    const externeCount = useMemo(
        () =>
            (history || []).filter(
                (h) =>
                    h.candidate_source === "external" ||
                    h.candidate_source === "all"
            ).length,
        [history]
    );
    const cards = [
        {
            id: "01",
            title: t("documents_analyzedd") || "Documents analyzed",
            value: fileCount,
            desc:
                t("documents_analyzed_desc") ||
                "CVs and PDFs parsed from your uploads.",
        },
        {
            id: "02",
            title: t("prompts_analyzedd") || "Prompts analyzed",
            value: promptCount,
            desc:
                t("prompts_analyzed_desc") ||
                "Positions processed from typed prompts.",
        },
        {
            id: "03",
            title: t("source_internall") || "Internal source",
            value: interneCount,
            desc:
                t("source_internal_desc") ||
                "Analyses based on your internal candidate pool.",
        },
        {
            id: "04",
            title: t("source_externall") || "External source",
            value: externeCount,
            desc:
                t("source_external_desc") ||
                "Analyses matched via external pipelines.",
        },
    ];

    return (
        <section className={styles.wrapper} aria-label="Reports overview">
            <div className={styles.headerWrapper}>
                <button
                    className={styles.backButton}
                    onClick={() => window.history.back()}
                >
                    ← {t("back", "Changer de type")}
                </button>

                <div className={styles.header}>
                    <p className={styles.eyebrow}>
                        {t("simple_steps")}
                    </p>
                    <h2 className={styles.title}>
                        {t("reports_headline")}
                    </h2>
                    <div className={styles.rule} aria-hidden="true" />
                </div>
            </div>

            <div className={styles.grid}>
                {cards.map((c) => (
                    <div key={c.id} className={styles.card}>
                        <div className={styles.cardHeader}>
                            <span className={styles.cardIndex}>{c.id}.</span>
                            <h3 className={styles.cardTitle}>{c.title}</h3>
                        </div>
                        <div className={styles.cardValueWrapper}>
                            <span className={styles.cardValue}>{loading ? "…" : c.value}</span>
                        </div>
                        <p className={styles.cardDesc}>{c.desc}</p>
                    </div>
                ))}
            </div>


            <div className={styles.ctaBar}>

                <button
                    type="button"
                    className={styles.ctaBtn}
                    onClick={() => navigate("/analysis/202")}
                >
                    {t("view_history") || "View History"}
                    <LuArrowRight aria-hidden="true" />
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
        </section>
    );
};

export default StatsPage;

