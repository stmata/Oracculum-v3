import React, {
  useState,
  useLayoutEffect,
  useMemo,
  useRef,
  useCallback,
} from "react";
import styles from "./MatchingList.module.css";
import { useLocation } from "react-router-dom";
import JobDescriptionCard from "../JobDescriptionCard/JobDescriptionCard";
import CandidateCard from "../CandidateCard/CandidateCard";
import CandidateDetails from "../CandidateDetails/CandidateDetails";
import { AiOutlineLeftCircle, AiOutlineRightCircle } from "react-icons/ai";
import { useTranslation } from "../../../../../utils/useTranslation";

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

export default function MatchingList() {
  const { state } = useLocation();
  const { t } = useTranslation();

  const [isMobileView, setIsMobileView] = useState(false);
  const [showDetailsOverlay, setShowDetailsOverlay] = useState(false);

  const {
    job_description,
    matches: incomingMatches,
    results,
    lang,
    locale,
    language,
    note,
  } = state || {};

  useLayoutEffect(() => {
    const update = () => {
      setIsMobileView(window.innerWidth <= 1023);
    };

    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const preferredLocale = useMemo(() => {
    const raw =
      (lang || locale || language || "").toString().toLowerCase() ||
      (typeof navigator !== "undefined" ? navigator.language : "en");
    return raw.startsWith("fr") ? "fr" : "en";
  }, [lang, locale, language]);

  const normalized = useMemo(() => {
    const source =
      (Array.isArray(incomingMatches) && incomingMatches.length
        ? incomingMatches
        : Array.isArray(results)
          ? results
          : []) || [];

    return source.filter(Boolean).map((item, idx) => {
      const locBlock =
        item?.[preferredLocale] ??
        item?.llm?.[preferredLocale] ??
        item?.en ??
        item?.llm?.en ??
        item?.fr ??
        item?.llm?.fr ??
        {};

      const displayName =
        (typeof item.collab_key === "string" && item.collab_key) ||
        (typeof item.name === "string" && item.name) ||
        `Candidate ${String(idx + 1).padStart(2, "0")}`;

      const combinedRaw = item?.combined_score ?? locBlock?.combined_score;
      const matchRaw = locBlock?.match_score ?? item?.match_score;

      const scorePct =
        combinedRaw != null ? toPct(combinedRaw) : toPct(matchRaw);

      return {
        name: displayName,
        score: scorePct,

        locale_block: locBlock,
        llm: item?.llm,
        source: item?.source,
        collab_key: item?.collab_key,
        embedding_score: Number(item?.embedding_score),

        _raw: item,
        _idx: idx,
      };
    });
  }, [incomingMatches, results, preferredLocale]);

  const rows = useMemo(() => {
    const copy = [...normalized];
    copy.sort((a, b) => (b?.score ?? 0) - (a?.score ?? 0));
    return copy;
  }, [normalized]);

  const weightOf = useCallback(() => 1, []);
  const { offsets, totalWeight } = useMemo(() => {
    const offs = [];
    let sum = 0;
    for (let i = 0; i < rows.length; i++) {
      offs[i] = sum;
      sum += weightOf(rows[i]);
    }
    return { offsets: offs, totalWeight: sum };
  }, [rows, weightOf]);

  const pageSizeUnits = 8;
  const totalPages = Math.max(1, Math.ceil(totalWeight / pageSizeUnits));

  const pageForIndex = useCallback(
    (i) => Math.floor((offsets[i] ?? 0) / pageSizeUnits) + 1,
    [offsets]
  );

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIndex, setSelectedIndex] = useState(null);

  const leftRef = useRef(null);
  const rightRef = useRef(null);
  const splitRef = useRef(null);

  const paginatedRows = useMemo(() => {
    const pageStartUnits = (currentPage - 1) * pageSizeUnits;

    let i = 0;
    while (i < rows.length && (offsets[i] ?? 0) < pageStartUnits) i++;

    const out = [];
    let used = 0;

    while (i < rows.length && used < pageSizeUnits) {
      const w = weightOf(rows[i]);
      if (used + w > pageSizeUnits) break;
      out.push({ candidate: rows[i], index: i });
      used += w;
      i++;
    }

    return out;
  }, [rows, offsets, currentPage, weightOf]);

  useLayoutEffect(() => {
    if (selectedIndex === null && paginatedRows.length) {
      setSelectedIndex(paginatedRows[0].index);
    } else if (
      selectedIndex !== null &&
      !paginatedRows.some((item) => item.index === selectedIndex)
    ) {
      setSelectedIndex(paginatedRows[0]?.index ?? null);
    }
  }, [currentPage, paginatedRows, selectedIndex]);

  const gotoPage = useCallback(
    (next) => {
      const clamped = Math.max(1, Math.min(next, totalPages));
      if (clamped !== currentPage) setCurrentPage(clamped);
    },
    [currentPage, totalPages]
  );

  const handlePageChange = (dir) => gotoPage(currentPage + dir);

  const shownFrom = paginatedRows[0]?.index + 1 || 0;
  const shownTo = paginatedRows[paginatedRows.length - 1]?.index + 1 || 0;
  const hasNoMatchesNote =
    typeof note === "string" && note.trim().toLowerCase() === "no matches exist";
  const hasNoRows = rows.length === 0;
  const showEmpty = hasNoMatchesNote || hasNoRows;

  if (showEmpty) {
    const emptyMessage = hasNoMatchesNote
      ? t("noMatchesExistForJob")
      : t("noMatchesToDisplay");

    return (
      <div className={styles.containerr}>
        {job_description && <JobDescriptionCard job={job_description} />}
        <div className={styles.emptyState}>{emptyMessage}</div>
      </div>
    );
  }
  return (
    <div className={styles.containerr}>
      <JobDescriptionCard job={job_description} />

      <div className={styles.splitView} ref={splitRef}>
        <div
          ref={leftRef}
          className={
            selectedIndex !== null && !isMobileView
              ? styles.leftPanel
              : styles.fullWidth
          }
        >
          {paginatedRows.map(({ candidate, index }) => (
            <div
              key={candidate._idx ?? index}
              data-card
              onClick={() => {
                const page = pageForIndex(index);
                if (page !== currentPage) gotoPage(page);
                setSelectedIndex(index);
                if (isMobileView) setShowDetailsOverlay(true);
              }}
            >
              <CandidateCard
                candidate={candidate}
                index={index}
                isSelected={index === selectedIndex}
              />
            </div>
          ))}

        </div>

        {!isMobileView && selectedIndex !== null && rows[selectedIndex] && (
          <div className={styles.rightPanel} ref={rightRef}>
            <CandidateDetails
              candidate={{ ...rows[selectedIndex], locale: preferredLocale }}
            />
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className={styles.paginationContainer}>
          <button
            onClick={() => handlePageChange(-1)}
            disabled={currentPage === 1}
            className={`${styles.arrow} ${currentPage === 1 ? styles.disabled : ""
              }`}
            aria-label={t("matching.pagination.prev")}
          >
            <AiOutlineLeftCircle
              className={`${styles.iconList} ${styles.boldIcon} ${currentPage === 1 ? styles.disabledIcon : ""
                }`}
            />
          </button>

          <div className={styles.countBar}>
            {shownFrom}-{shownTo} / {rows.length}
          </div>

          <button
            onClick={() => handlePageChange(1)}
            disabled={currentPage === totalPages}
            className={`${styles.arrow} ${currentPage === totalPages ? styles.disabled : ""
              }`}
            aria-label={t("matching.pagination.next")}
          >
            <AiOutlineRightCircle
              className={`${styles.iconList} ${styles.boldIcon} ${currentPage === totalPages ? styles.disabledIcon : ""
                }`}
            />
          </button>
        </div>
      )}

      {isMobileView &&
        showDetailsOverlay &&
        selectedIndex !== null &&
        rows[selectedIndex] && (
          <div className={styles.detailsOverlay}>
            <div className={styles.detailsOverlayInner}>
              <button
                type="button"
                className={styles.closeOverlayBtn}
                onClick={() => setShowDetailsOverlay(false)}
                aria-label={t("close") || "Fermer"}
              >
                ×
              </button>

              <CandidateDetails
                candidate={{ ...rows[selectedIndex], locale: preferredLocale }}
              />
            </div>
          </div>
        )}
    </div>
  );
}
