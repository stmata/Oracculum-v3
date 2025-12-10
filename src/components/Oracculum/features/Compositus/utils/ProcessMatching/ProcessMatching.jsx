import React, { useMemo } from "react";
import styles from "./ProcessMatching.module.css";
import { LuBrainCircuit } from "react-icons/lu";
import { PiReadCvLogo } from "react-icons/pi";
import { AiOutlineOrderedList } from "react-icons/ai";
import { IoShieldCheckmarkOutline } from "react-icons/io5";

export default function ProcessMatching({
    stages = {},
    jobState,
    errorText,
    httpStatus,
    errorStage,
}) {
    const clamp = (n) => Math.max(0, Math.min(100, Math.round(Number(n) || 0)));

    const parsePct = clamp(stages?.parse_offer?.percent ?? 0);
    const rankPct = clamp(stages?.rank?.percent ?? 0);
    const explainPct = clamp(stages?.explain?.percent ?? 0);
    const donePct = clamp(stages?.done?.percent ?? 0);

    const totalPct = useMemo(() => {
        if (jobState === "done") return 100;
        const parts = [parsePct, rankPct, explainPct];
        const avg = parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : 0;
        return clamp(Math.max(5, avg, donePct));
    }, [jobState, parsePct, rankPct, explainPct, donePct]);

    const wrapperClass =
        jobState === "done" ? styles.success :
            jobState === "error" ? styles.error :
                styles.info;

    const steps = useMemo(() => ([
        { key: "parse_offer", label: "Analyse de l’offre", Icon: PiReadCvLogo, sub: "Parsing & extraction" },
        { key: "rank", label: "Classement", Icon: AiOutlineOrderedList, sub: "Calcul des scores" },
        { key: "explain", label: "Explications", Icon: LuBrainCircuit, sub: "Raisons du matching" },
        { key: "total", label: "Progression totale", Icon: IoShieldCheckmarkOutline, sub: "du processus global" },
    ]), []);

    const reachedFlags = useMemo(() => {
        const n = steps.length;
        if (n <= 1) return [true];
        return steps.map((_, i) => {
            const threshold = (i * 100) / (n - 1);
            return totalPct >= threshold;
        });
    }, [steps.length, totalPct]);

    return (
        <div className={`${styles.wrapper} ${wrapperClass}`} aria-live="polite" aria-label="Progression du processus">
            <div className={styles.headerRow}>
                <div className={styles.trackBox}>
                    <div className={styles.iconsRow}>
                        {steps.map((s, i) => {
                            const reached = Boolean(reachedFlags[i]);
                            return (
                                <div key={s.key} className={`${styles.iconWrap} ${reached ? styles.reached : ""}`} aria-label={s.label}>
                                    <div className={styles.iconCircle}>
                                        <s.Icon aria-hidden />
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div className={styles.track} aria-hidden>
                        <div
                            className={`${styles.trackFill} ${jobState === "done" ? styles.trackFillSuccess :
                                jobState === "error" ? styles.trackFillError : ""
                                }`}
                            style={{ width: `${totalPct}%` }}
                        />
                    </div>

                    <div className={styles.labelsRow}>
                        {steps.map((s, i) => {
                            const reached = Boolean(reachedFlags[i]);
                            return (
                                <div key={s.key} className={styles.labelItem}>
                                    <div className={`${styles.label} ${reached ? styles.labelReached : ""}`}>{s.label}</div>
                                    <div className={styles.sub}>{s.sub}</div>
                                </div>
                            );
                        })}
                    </div>

                    {jobState === "error" && <div className={styles.errorBanner} role="alert">{errorText || "Erreur pendant le matching."}</div>}
                </div>
            </div>
        </div>
    );
}
