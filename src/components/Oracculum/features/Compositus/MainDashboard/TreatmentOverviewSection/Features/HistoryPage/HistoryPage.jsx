import React, { useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useUploadHistory } from "../../../../../../../../context/UploadHistoryContext";
import { useTranslation } from "../../../../../../../../utils/useTranslation";
import styles from "./HistoryPage.module.css";
import { FaDownload, FaTrashAlt } from "react-icons/fa";
import ConfirmModal from "../../../../ConfirmModal/ConfirmModal";
import { useAppContext } from "../../../../../../../../context/AppContext";
import { getIconComponentFromImport } from "../../../../../../../../constants/icons";
import { exportMatchingPdf } from "../../../../utils/pdf";

const HistoryPage = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { history = [], loading, error, refresh, removeByDate } = useUploadHistory();

  const [query, setQuery] = useState("");
  const [tab, setTab] = useState("file");
  const { lang } = useAppContext();
  const [source, setSource] = useState("all");
  const [offerKind, setOfferKind] = useState("all");

  const toText = (v) => {
    if (v == null) return "";
    if (typeof v === "string" || typeof v === "number") return String(v);
    if (typeof v === "object") {
      return v.name || v.normalized || v.summary || v.raw || "";
    }
    return "";
  };

  const pickTitleText = (job) => {
    const jt = job?.job_title;
    if (!jt) return "";
    if (typeof jt === "string") return jt;
    return jt.normalized || jt.raw || "";
  };

  const pickShortDescText = (job) => {
    const sd = job?.short_description;
    if (!sd) return "";
    if (typeof sd === "string") return sd;
    return sd.summary || "";
  };

  const safeLocation = (job) => toText(job?.location);
  const safeDepartment = (job) => toText(job?.department);

  const normSource = (v) => (v || "internal").toLowerCase();

  const matchSource = (item, wanted) => {
    if (wanted === "all") return true;
    const src = normSource(item?.candidate_source);
    return src === wanted;
  };
  const onDownload = (item) => {
    exportMatchingPdf({ item, lang, t });
  };

  const isExistingOffer = (item) => {
    if (typeof item?.is_new_offer === "boolean") return !item.is_new_offer;
    const mode = String(item?.offer_mode || "").toLowerCase();
    return mode === "existing";
  };
  const isNewOffer = (item) => !isExistingOffer(item);

  const matchOfferKind = (item, wanted) => {
    if (wanted === "all") return true;
    if (wanted === "existing") return isExistingOffer(item);
    if (wanted === "new") return isNewOffer(item);
    return true;
  };

  const files = useMemo(() => history.filter((h) => h.doc_type === "file"), [history]);
  const prompts = useMemo(() => history.filter((h) => h.doc_type === "prompt"), [history]);

  const filterFn = useCallback(
    (item) => {
      if (!query.trim()) return true;
      const job = item?.job_description?.[lang] || {};
      const hay = `${pickTitleText(job)} ${pickShortDescText(job)}`.toLowerCase();
      return hay.includes(query.trim().toLowerCase());
    },
    [query, lang]
  );

  const list = useMemo(() => {
    const baseAll = [...files, ...prompts];
    const base = tab === "file" ? files : tab === "prompt" ? prompts : baseAll;

    const afterSource = base.filter((it) => matchSource(it, source));
    const afterOffer = afterSource.filter((it) => matchOfferKind(it, offerKind));
    const afterSearch = afterOffer.filter(filterFn);

    return afterSearch.sort((a, b) => {
      const ta = a?.date ? new Date(a.date).getTime() : -Infinity;
      const tb = b?.date ? new Date(b.date).getTime() : -Infinity;
      return tb - ta;
    });
  }, [tab, source, offerKind, files, prompts, filterFn]);

  const noAny = files.length === 0 && prompts.length === 0;
  const noForFilter = list.length === 0;

  const openRow = useCallback(
    (item) => {
      navigate("/matching-list", {
        state: {
          job_description: item.job_description,
          matches: item.matches,
        },
      });
    },
    [navigate]
  );

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [target, setTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const onAskDelete = (item) => {
    setTarget(item);
    setConfirmOpen(true);
  };
  const onCancelDelete = () => {
    setConfirmOpen(false);
    setTarget(null);
  };
  const onConfirmDelete = async () => {
    if (!target?.date) return;
    setDeleting(true);
    try {
      await removeByDate?.(target.date);
      await refresh?.();
    } finally {
      setDeleting(false);
      onCancelDelete();
    }
  };



  const toneClass = (item) => {
    if (isExistingOffer(item)) return styles.toneViolet;
    const src = (item?.candidate_source || "").toLowerCase();
    if (src === "external") return styles.toneRose;
    if (src === "all") return styles.toneAmber;
    return styles.toneLilac;
  };

  const timeAgo = (iso) => {
    if (!iso) return "—";
    const now = Date.now();
    const then = new Date(iso).getTime();
    const diff = Math.max(0, now - then);

    const min = Math.floor(diff / 60000);
    const hr = Math.floor(min / 60);
    const day = Math.floor(hr / 24);
    const mo = Math.floor(day / 30);
    const yr = Math.floor(day / 365);

    const fr = (n, u) => `il y a ${n} ${u}${n > 1 ? "s" : ""}`;
    const en = (n, u) => `${n} ${u}${n > 1 ? "s" : ""} ago`;
    const F = lang === "fr" ? fr : en;

    if (yr >= 1) return F(yr, lang === "fr" ? "an" : "year");
    if (mo >= 1) return F(mo, lang === "fr" ? "mois" : "month");
    if (day >= 1) return F(day, lang === "fr" ? "jour" : "day");
    if (hr >= 1) return F(hr, lang === "fr" ? "heure" : "hour");
    if (min >= 1) return F(min, lang === "fr" ? "minute" : "minute");
    return lang === "fr" ? "à l’instant" : "just now";
  };

  return (
    <section className={styles.wrapper} aria-live="polite">
      <header className={styles.header}>

        <button
          className={styles.backButton}
          onClick={() => window.history.back()}
        >
          ← {t("back", "Retour")}
        </button>

        <div className={styles.headerContent}>
          <h2 className={styles.title}>
            {t("history") || "Historique des traitements"}
          </h2>

          <p className={styles.subtitle}>
            {t("history_desc") || "Recherchez, ouvrez, exportez ou supprimez vos analyses."}
          </p>
        </div>

      </header>


      <div className={styles.content}>
        <aside className={styles.sidebar}>
          <div className={styles.filtersBar} role="complementary" aria-label={t("filters")}>
            <h3 className={styles.filterTitle}>{t("filters")}:</h3>

            <div className={styles.filterBlock}>
              <label htmlFor="history-search" className={styles.filterLabel}>
                {t("search_help")}
              </label>
              <div className={styles.inputShell}>
                <input
                  id="history-search"
                  className={styles.searchInput}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("search")}
                  aria-label={t("search") || "Search"}
                />
              </div>
            </div>

            <div className={styles.filterBlock}>
              <div className={styles.filterLabel}>{t("choose_between")}</div>
              <div className={styles.chipGroup} role="tablist" aria-label="Type">
                <button
                  role="tab"
                  aria-selected={tab === "all"}
                  className={`${styles.chip} ${tab === "all" ? styles.chipActive : ""}`}
                  onClick={() => setTab("all")}
                >
                  {t("sources_all")}
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "file"}
                  className={`${styles.chip} ${tab === "file" ? styles.chipActive : ""}`}
                  onClick={() => setTab("file")}
                >
                  {t("files")}
                </button>
                <button
                  role="tab"
                  aria-selected={tab === "prompt"}
                  className={`${styles.chip} ${tab === "prompt" ? styles.chipActive : ""}`}
                  onClick={() => setTab("prompt")}
                >
                  {t("prompts")}
                </button>
              </div>
            </div>

            <div className={styles.filterBlock}>
              <div className={styles.filterLabel}>{t("ut_candidate_source") || "Source"}</div>
              <div className={styles.chipGroup}>
                <button
                  className={`${styles.chip} ${source === "all" ? styles.chipActive : ""}`}
                  onClick={() => setSource("all")}
                >
                  {t("sources_all")}
                </button>
                <button
                  className={`${styles.chip} ${source === "internal" ? styles.chipActive : ""}`}
                  onClick={() => setSource("internal")}
                >
                  {t("source_internal")}
                </button>
                <button
                  className={`${styles.chip} ${source === "external" ? styles.chipActive : ""}`}
                  onClick={() => setSource("external")}
                >
                  {t("source_external")}
                </button>
              </div>
            </div>

            <div className={styles.filterBlock}>
              <div className={styles.filterLabel}>
                {t("offer_kind") || (lang === "fr" ? "Type d’offre" : "Offer type")}
              </div>
              <div className={styles.chipGroup}>
                <button
                  className={`${styles.chip} ${offerKind === "all" ? styles.chipActive : ""}`}
                  onClick={() => setOfferKind("all")}
                >
                  {t("sources_all")}
                </button>
                <button
                  className={`${styles.chip} ${offerKind === "new" ? styles.chipActive : ""}`}
                  onClick={() => setOfferKind("new")}
                >
                  {t("offer_new") || (lang === "fr" ? "Nouvelle" : "New")}
                </button>
                <button
                  className={`${styles.chip} ${offerKind === "existing" ? styles.chipActive : ""}`}
                  onClick={() => setOfferKind("existing")}
                >
                  {t("offer_existing") || (lang === "fr" ? "Existante" : "Existing")}
                </button>
              </div>
            </div>
          </div>

          <div className={styles.sidebarFooter}>
            <p className={styles.helpText}>{t("export_hint")}</p>
          </div>
        </aside>

        <main className={styles.results}>
          {error && <div className={styles.error}>{error}</div>}
          {loading && <div className={styles.loading}>{t("loading") || "Chargement..."}</div>}

          {noAny && !loading && (
            <div className={styles.emptyState}>
              {t("no_match_yet") || (lang === "fr" ? "Aucun résultat pour le moment" : "No match yet")}
            </div>
          )}

          {!noAny && noForFilter && !loading && (
            <div className={styles.emptyState}>
              {t("no_match_yet") || (lang === "fr" ? "Aucun résultat pour le moment" : "No match yet")}
            </div>
          )}

          <div className={styles.scrollRegion}>
            <div className={styles.cardsList}>
              {list.map((item, i) => {
                const job = item?.job_description?.[lang] || {};
                let Icon;
                try {
                  Icon = getIconComponentFromImport(item?.job_description?.react_icon_import);
                } catch {
                  Icon = null;
                }

                const titleText = pickTitleText(job) || "N/A";
                const shortText = pickShortDescText(job);

                return (
                  <article
                    key={item.date || i}
                    className={`${styles.card} ${toneClass(item)}`}
                    onClick={() => openRow(item)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") openRow(item);
                    }}
                  >
                    <div className={styles.cardInner}>
                      <div className={styles.cardTopMeta}>
                        <span className={styles.squareBadge}>
                          {Icon ? <Icon className={styles.icon} /> : <span className={styles.iconFallback}>•</span>}
                        </span>
                        <div className={styles.timeAgo}>{timeAgo(item.date)}</div>
                      </div>

                      <div className={styles.cardMain}>
                        <h3 className={styles.cardTitle}>{titleText}</h3>
                        <p className={styles.cardSub}>{shortText}</p>
                      </div>
                    </div>

                    <div className={styles.cardBottom}>
                      <div className={styles.bottomMeta}>
                        {safeLocation(job) && <span>{safeLocation(job)}</span>}
                        {safeLocation(job) && safeDepartment(job) && <span>•</span>}
                        {safeDepartment(job) && <span>{safeDepartment(job)}</span>}
                      </div>

                      <div className={styles.cardCtas}>
                        <button
                          className={`${styles.btnGhost} ${styles.btnIcon}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onDownload(item);
                          }}
                          title={t("download") || "Download"}
                        >
                          <FaDownload />{" "}
                          <span>{t("download") || (lang === "fr" ? "Télécharger" : "Download")}</span>
                        </button>
                        <button
                          className={`${styles.btnGhost} ${styles.btnDanger} ${styles.btnIcon}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            onAskDelete(item);
                          }}
                          title={t("delete") || "Delete"}
                        >
                          <FaTrashAlt />{" "}
                          <span>{t("delete") || (lang === "fr" ? "Supprimer" : "Delete")}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </main>
      </div>

      <ConfirmModal
        open={confirmOpen}
        title={t("confirm_delete_title") || "Supprimer l’analyse ?"}
        message={
          deleting
            ? (
              <div className={styles.loaderWrapper}>
                <div className={styles.spinner}></div>
              </div>
            )
            : target
              ? `${t("confirm_delete_message") || "Cette action est irréversible."}\n${pickTitleText(target?.job_description?.[lang] || {}) || "-"
              } • ${target?.date
                ? new Date(target.date).toLocaleString(lang === "fr" ? "fr-FR" : "en-US")
                : "-"
              }`
              : t("confirm_delete_message") || "Cette action est irréversible."
        }
        confirmText={t("delete") || "Supprimer"}
        cancelText={t("cancel") || "Annuler"}
        danger
        onConfirm={onConfirmDelete}
        onCancel={onCancelDelete}
      />

    </section>
  );
};

export default HistoryPage;
