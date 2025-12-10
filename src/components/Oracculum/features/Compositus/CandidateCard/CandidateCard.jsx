import React from "react";
import styles from "./CandidateCard.module.css";
import { FaStar, FaStarHalfAlt, FaRegStar } from "react-icons/fa";
import { useTranslation } from "../../../../../utils/useTranslation";

function clamp01(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(1, n));
}
function toPct(x) {
  const n = Number(x);
  if (!Number.isFinite(n)) return 0;
  return n <= 1 ? Math.round(clamp01(n) * 100) : Math.round(Math.max(0, Math.min(100, n)));
}

function stripExt(filename) {
  if (typeof filename !== "string") return filename;
  return filename.replace(/\.(pdf|docx?|rtf|txt)$/i, "");
}

function extractCombinedScore(raw) {
  const cs = raw?.combined_score;

  if (Number.isFinite(Number(cs))) return Number(cs);

  if (Array.isArray(cs)) {
    const id = raw?.collab_key || stripExt(raw?.name);
    const found = cs.find(
      (c) =>
        c?.collab_key === id ||
        stripExt(c?.name) === id
    );
    if (found) {
      if (Number.isFinite(Number(found.combined_score))) return Number(found.combined_score);
      if (Number.isFinite(Number(found.score))) return Number(found.score);
    }
  }

  return raw?.score ?? raw?.embedding_score ?? 0;
}

const StarRating = ({ value }) => {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const fullStars = Math.floor(pct / 20);
  const hasHalf = pct % 20 >= 10;
  const emptyStars = 5 - fullStars - (hasHalf ? 1 : 0);

  const stars = [];
  for (let i = 0; i < fullStars; i++) {
    stars.push(<FaStar key={`full-${i}`} className={styles.star} />);
  }
  if (hasHalf) {
    stars.push(<FaStarHalfAlt key="half" className={styles.star} />);
  }
  for (let i = 0; i < emptyStars; i++) {
    stars.push(<FaRegStar key={`empty-${i}`} className={styles.star} />);
  }

  return (
    <div className={styles.stars} title={`${pct}%`}>
      {stars}
    </div>
  );
};

const CandidateCard = ({ candidate, isSelected, onClick, index }) => {
  const { t } = useTranslation();

  let nip = "—";

  if (Array.isArray(candidate?._raw?.combined_score)) {
    const found = candidate._raw.combined_score.find(
      (c) =>
        c?.name === candidate?._raw?.name ||
        c?.collab_key === candidate?.collab_key
    );

    if (found) {
      nip =
        found.NIP ||
        found.collab_key ||
        found.name ||
        nip;
    }
  }

  if (nip === "—") {
    nip =
      candidate?._raw?.NIP ||
      candidate?.NIP ||
      candidate?.collab_key ||
      candidate?._raw?.collab_key ||
      candidate?.name ||
      candidate?._raw?.name ||
      "—";
  }

  const rawScore = extractCombinedScore(candidate?._raw ?? candidate);
  const score = toPct(rawScore);

  const job_history =
    (Array.isArray(candidate?.job_history) && candidate.job_history) ||
    (Array.isArray(candidate?.locale_block?.job_history) && candidate.locale_block.job_history) ||
    (Array.isArray(candidate?._raw?.job_history) && candidate._raw.job_history) ||
    [];

  return (
    <div
      className={`${styles.card} ${isSelected ? styles.selected : ""}`}
      onClick={onClick}
      role="button"
      aria-pressed={isSelected ? "true" : "false"}
      tabIndex={0}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick(e);
        }
      }}
      title={candidate?.source ? `Source: ${candidate.source}` : undefined}
    >
      <div className={styles.cardHeader}>
        <h3 className={styles.name}>{t("Candidat")} {index + 1} <strong className={styles.namestrong}>(NIP {nip})</strong>
        </h3>

        <StarRating value={score} />
      </div>


    </div>
  );
};

export default CandidateCard;
