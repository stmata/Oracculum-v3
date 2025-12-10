import React from "react";
import styles from "./CandidateDetails.module.css";
import { useTranslation } from "../../../../../utils/useTranslation";

const safeArr = (v) => (Array.isArray(v) ? v : []);
const safeStr = (v) => (v == null ? "" : String(v));

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

function toPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return n <= 1
    ? Math.round(clamp01(n) * 100)
    : Math.round(Math.max(0, Math.min(100, n)));
}

function getLangBlock(obj, lang) {
  if (!obj || typeof obj !== "object") return {};
  return obj?.[lang] ?? obj?.en ?? obj?.fr ?? obj ?? {};
}

function pickLangBlock(candidate, lang) {
  if (!candidate || typeof candidate !== "object") return {};
  const llmBlock = getLangBlock(candidate.llm, lang);
  const mainBlock = getLangBlock(candidate, lang);
  return llmBlock && Object.keys(llmBlock).length > 0 ? llmBlock : mainBlock;
}

export default function CandidateDetails({ candidate }) {
  const { t, lang } = useTranslation();
  if (!candidate || typeof candidate !== "object") {
    return (
      <div className={styles.details}>
        <div className={styles.detailsHeader}>
          <h3 className={styles.title}>{t("candidate_details_title")}</h3>
        </div>
        <p className={styles.reasoning}>{t("candidate_no_selected")}</p>
      </div>
    );
  }

  const data = pickLangBlock(candidate, lang);

  const summary =
    (data && typeof data === "object" && data.summary) ||
    (candidate && typeof candidate === "object" && candidate.summary) ||
    {};

  const suggestions = Array.isArray(data?.suggestions)
    ? data.suggestions
    : Array.isArray(candidate?.suggestions)
      ? candidate.suggestions
      : [];

  const skills_matched = safeArr(summary.skills_matched);
  const skills_missing = safeArr(summary.skills_missing);
  const experience_matched = safeArr(summary.experience_matched);
  const experience_missing = safeArr(summary.experience_missing);
  const qualifications_matched = safeArr(summary.qualifications_matched);
  const qualifications_missing = safeArr(summary.qualifications_missing);

  const excludeKeys = new Set([
    "name",
    "match_score",
    "combined_score",
    "score",
    "percentage",
    "embedding_score",
    "job_history",
    "summary",
    "suggestions",
    "reasoning",
    "locale_block",
    "llm",
    "source",
    "collab_key",
    "_raw",
    "_idx",
  ]);

  const rest = data && typeof data === "object" ? data : {};
  const otherEntries = Object.entries(rest).filter(
    ([key]) => !excludeKeys.has(key)
  );
  const hasReasoning = !!rest?.reasoning;
  const hasOtherEntries = otherEntries.length > 0;
  const hasSkills = skills_matched.length > 0 || skills_missing.length > 0;
  const hasExperience =
    experience_matched.length > 0 || experience_missing.length > 0;
  const hasQualifications =
    qualifications_matched.length > 0 || qualifications_missing.length > 0;
  const hasSuggestions = Array.isArray(suggestions) && suggestions.length > 0;

  const hasAnyDetails =
    hasReasoning ||
    hasOtherEntries ||
    hasSkills ||
    hasExperience ||
    hasQualifications ||
    hasSuggestions;


  return (
    <div className={styles.details}>
      <div className={styles.detailsHeader}>
        <h3 className={styles.title}>{t("candidate_details_title")}</h3>
      </div>

      {hasReasoning && (
        <div className={styles.section}>
          <p className={styles.reasoning}>{safeStr(rest.reasoning)}</p>
        </div>
      )}



      {hasSkills && (
        <div className={styles.section2}>
          <h4>🛠️ {t("candidate_skills")}</h4>
          {skills_matched.length > 0 && (
            <p>
              <strong>🧠 {t("matched")}</strong>{" "}
              <span className={styles.skillList}>
                {skills_matched.join(" • ")}
              </span>
            </p>
          )}
          {skills_missing.length > 0 && (
            <p>
              <strong>🧩 {t("missing")}</strong>{" "}
              <span className={styles.skillList}>
                {skills_missing.join(" • ")}
              </span>
            </p>
          )}
        </div>
      )}

      {hasExperience && (
        <div className={styles.section2}>
          <h4>💼 {t("candidate_experience")}</h4>
          {experience_matched.length > 0 && (
            <p>
              <strong>🧠 {t("matched")}</strong> {experience_matched.join(" • ")}
            </p>
          )}
          {experience_missing.length > 0 && (
            <p>
              <strong>🧩 {t("missing")}</strong> {experience_missing.join(" • ")}
            </p>
          )}
        </div>
      )}

      {hasQualifications && (
        <div className={styles.section2}>
          <h4>🎓 {t("candidate_qualifications")}</h4>
          {qualifications_matched.length > 0 && (
            <p>
              <strong>🧠 {t("matched")}</strong> {qualifications_matched.join(" • ")}
            </p>
          )}
          {qualifications_missing.length > 0 && (
            <p>
              <strong>🧩 {t("missing")}</strong> {qualifications_missing.join(" • ")}
            </p>
          )}
        </div>
      )}

      {hasSuggestions && (
        <div className={styles.section2}>
          <h4>🚀 {t("candidate_program_suggestions")}</h4>
          {suggestions.map((s, i) => {
            let name = "";
            let url = "";
            let fallbackText = "";

            if (s?.recommendation && typeof s.recommendation === "object") {
              name = s.recommendation.best_match || "";
              url = s.recommendation.url || "";
              fallbackText = s.recommendation.reason || "";
            } else if (typeof s?.recommendation === "string") {
              const match = s.recommendation.match(
                /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/
              );
              if (match) {
                name = match[1];
                url = match[2];
                fallbackText = s.recommendation.replace(match[0], "").trim();
              } else {
                fallbackText = s.recommendation;
              }
            }

            return (
              <div key={i} className={styles.suggestionItem}>
                {!!s?.missing && (
                  <p>
                    💡 <strong>{s.missing}</strong>
                  </p>
                )}

                {url && name && (
                  <p>
                    👉{" "}
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.programLink}
                    >
                      {name}
                    </a>
                  </p>
                )}

                {fallbackText && (
                  <p className={styles.reasonText}>
                    <em>{fallbackText.trim()}</em>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!hasAnyDetails && (
        <div className={styles.section}>
          <p className={styles.reasoning_error}>{t("candidate_error_no_details")}</p>
        </div>
      )}
    </div>
  );
}
