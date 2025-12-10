import React from "react";
import styles from "./ProcessSteps.module.css";
import { LuFileUp, LuBrainCircuit } from "react-icons/lu";
import { IoShieldCheckmarkOutline } from "react-icons/io5";
import { AiOutlineCluster } from "react-icons/ai";
import { PiReadCvLogo } from "react-icons/pi";
import { useTranslation } from "../../../../../../../../../utils/useTranslation";

export default function ProcessSteps({
  stages = {},
  jobState,
  variant = "external",
  errorText,
  httpStatus,
  errorStage,
  hidePercents = false,
}) {
  const { t } = useTranslation();

  const ERROR_STAGE_LABELS = {
    upload_or_read: t("err_stage_upload_or_read", "Lecture / parsing"),
    summaries: t("err_stage_summaries", "Extraction LLM / résumés"),
    clustering: t("err_stage_clustering", "Regroupement"),
  };

  const isDuplicate =
    Number(httpStatus) === 409 ||
    /existe déjà|already exists|duplicate|doublon/i.test(String(errorText || ""));
  const isError = jobState === "error" || isDuplicate;

  if (isError) {
    const title = isDuplicate
      ? t("dup_error_title", "Doublon détecté")
      : t("generic_error_title", "Erreur de traitement");

    const msg =
      (errorText && String(errorText)) ||
      (httpStatus ? `${Number(httpStatus)}` : "") ||
      t("total_step_error_desc", "Une erreur est survenue. Réessaie ou vérifie ton fichier.");

    const stageKey = String(errorStage || "").toLowerCase();
    const stageLabel =
      ERROR_STAGE_LABELS[stageKey] ||
      (stageKey ? stageKey : t("err_stage_unknown", "Étape inconnue"));

    const filename =
      stages?.parsing?.filename ||
      stages?.vac_upload?.filename ||
      stages?.upload?.filename ||
      stages?.[stageKey]?.filename ||
      null;

    return (
      <div className={`${styles.wrapper} ${styles.error}`} role="alert" aria-live="assertive">
        <div className={styles.errorCenter}>
          <div className={styles.errorIconWrap}>
            <IoShieldCheckmarkOutline className={styles.errorIcon} aria-hidden />
          </div>
          <div className={styles.errorTitle}>{title}</div>
          <div className={styles.errorMsg}>{msg}</div>
        </div>
      </div>
    );
  }

  let imp = 0,
    sav = 0,
    sum = 0,
    clu = 0;

  if (variant === "internal") {
    imp = Number(stages?.import?.percent ?? 0) || 0;
    sav = Number(stages?.save?.percent ?? imp) || 0;
    sum = Number(stages?.summaries?.percent ?? 0) || 0;
    clu = Number(stages?.clustering?.percent ?? 0) || 0;
  } else {
    const reading =
      Number(
        stages?.reading?.percent ??
          stages?.upload?.percent ??
          stages?.vac_upload?.percent ??
          stages?.parsing?.percent ??
          0
      ) || 0;

    imp = clamp(reading);
    sav = imp;
    sum = clamp(stages?.summaries?.percent ?? stages?.vac_summaries?.percent ?? 0);
    clu = clamp(stages?.clustering?.percent ?? stages?.vac_clustering?.percent ?? 0);
  }

  let total = 0;

  const uploadDone = imp >= 100 && sav >= 100;
  const summariesDone = sum >= 100;
  const clusteringDone = clu >= 100;

  if (uploadDone) total += 40;    
  if (summariesDone) total += 40;  
  if (clusteringDone) total += 20;

  total = clamp(total);
  const upLabel =
    variant === "internal"
      ? t("upload_step_label", "Téléversement")
      : t("reading_step_label", "Lecture des CV");

  const upSub =
    variant === "internal"
      ? `${t("upload_step_desc", "Import des fichiers")}${hidePercents ? "" : ` — ${imp}%`}`
      : `${t("reading_step_desc", "Analyse & normalisation")}${
          hidePercents ? "" : ` — ${imp}%`
        }`;

  const sumLabel = t("summaries_step_label", "Résumés");
  const sumSub = `${t("summaries_step_desc", "Analyse et résumés")}${
    hidePercents ? "" : ` — ${sum}%`
  }`;

  const cluLabel = t("clustering_step_label", "Regroupement");
  const cluSub = `${t("clustering_step_desc", "Regroupement des collaborateurs")}${
    hidePercents ? "" : ` — ${clu}%`
  }`;

  const totalLabel = t("total_step_label", "Progression totale");
  const totalSub = `${hidePercents ? "" : `${total}% `}${t(
    "total_step_progress",
    "du processus global"
  )}`;

  const steps = [
    {
      key: "upload_or_read",
      label: upLabel,
      sub: upSub,
      percent: clamp((imp + sav) / 2),
      Icon: variant === "internal" ? LuFileUp : PiReadCvLogo,
    },
    {
      key: "summaries",
      label: sumLabel,
      sub: sumSub,
      percent: clamp(sum),
      Icon: LuBrainCircuit,
    },
    {
      key: "clustering",
      label: cluLabel,
      sub: cluSub,
      percent: clamp(clu),
      Icon: AiOutlineCluster,
    },
    {
      key: "total",
      label: totalLabel,
      sub: totalSub,
      percent: total,
      Icon: IoShieldCheckmarkOutline,
    },
  ];

  const stepCount = steps.length;

  let visualStepIndex = 0; 
  if (uploadDone) visualStepIndex = 1;       
  if (summariesDone) visualStepIndex = 2;    
  if (clusteringDone) visualStepIndex = 3; 

  const visualPct = clamp((visualStepIndex * 100) / Math.max(1, stepCount - 1));

  return (
    <div
      className={`${styles.wrapper} ${jobState === "done" ? styles.success : styles.info}`}
      aria-live="polite"
      aria-label={t("process_progress", "Progression du processus")}
    >
      <div className={styles.headerRow}>
        <div className={styles.trackBox}>
          <div className={styles.iconsRow}>
            {steps.map((s, i) => {
              const threshold = (i * 100) / Math.max(1, stepCount - 1);
              const isDoneStep =
                s.key === "upload_or_read"
                  ? uploadDone
                  : s.key === "summaries"
                  ? summariesDone
                  : s.key === "clustering"
                  ? clusteringDone
                  : clusteringDone; 

              const reached = visualPct >= threshold;
              const isCurrent = reached && !isDoneStep;

              return (
                <div
                  key={s.key}
                  className={`${styles.iconWrap} ${reached ? styles.reached : ""} ${
                    isCurrent ? styles.active : ""
                  }`}
                  aria-label={`${s.label}: ${s.sub}`}
                >
                  <div className={styles.iconCircle}>
                    <s.Icon aria-hidden />
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.track} aria-hidden>
            <div
              className={`${styles.trackFill} ${
                jobState === "done"
                  ? styles.trackFillSuccess
                  : jobState === "error"
                  ? styles.trackFillError
                  : ""
              }`}
              style={{ width: `${visualPct}%` }}
            />
          </div>

          <div className={styles.labelsRow}>
            {steps.map((s, i) => {
              const threshold = (i * 100) / Math.max(1, stepCount - 1);
              const reached = visualPct >= threshold;

              return (
                <div key={s.key} className={styles.labelItem}>
                  <div className={`${styles.label} ${reached ? styles.labelReached : ""}`}>
                    {s.label}
                  </div>
                  <div className={styles.sub}>{s.sub}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function clamp(n) {
  const x = Number(n) || 0;
  if (x < 0) return 0;
  if (x > 100) return 100;
  return Math.round(x);
}
