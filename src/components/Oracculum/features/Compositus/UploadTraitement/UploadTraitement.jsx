import React, { useState, useRef, useEffect, useMemo } from "react";
import styles from "./UploadTraitement.module.css";
import { uploadAnalysisAPI } from "../../../../../services/api";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "../../../../../context/AppContext";
import { useTranslation } from "../../../../../utils/useTranslation";
import { AiOutlineFilePdf } from "react-icons/ai";
import { PiFileDocBold } from "react-icons/pi";
import { MdClose } from "react-icons/md";
import { TbFiles } from "react-icons/tb";
import PillSelect from "../utils/PillSelect/PillSelect";
import { useUploadHistory } from "../../../../../context/UploadHistoryContext";
import { useCandidatesData } from "../../../../../context/CandidatesDataContext";
import MultiPillSelect from "../utils/PillSelect/MultiPillSelect";
import ProcessMatching from "../utils/ProcessMatching/ProcessMatching";

const ACCEPTED = [
  { mime: "application/pdf", ext: ".pdf", Icon: AiOutlineFilePdf },
  { mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ext: ".docx", Icon: PiFileDocBold },
  { mime: "application/msword", ext: ".doc", Icon: PiFileDocBold },
];

const UploadTraitement = () => {
  const [offerMode, setOfferMode] = useState("new");
  const [selectedOfferId, setSelectedOfferId] = useState("");
  const ORDER = ["init", "parse_offer", "embed_offer", "save_offer", "load_pool", "embed_missing", "rank", "threshold", "explain", "save_history", "done"];

  const [selectedDep, setSelectedDep] = useState("All");
  const [saveDocs, setSaveDocs] = useState("no");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [staffType, setStaffType] = useState("internal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const { user, lang } = useAppContext();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const { vacataires } = useUploadHistory();
  const { refresh: refreshHistory } = useUploadHistory();
  const { refresh: refreshOffers, items } = useCandidatesData();

  const offers = Array.isArray(items?.offers) ? items.offers : [];

  const [ssePayload, setSsePayload] = useState(null);
  const [finalSummary, setFinalSummary] = useState(null);
  const navigatedRef = useRef(false);

  const externalPeople = useMemo(() => {
    return (vacataires || [])
      .map((v) => {
        const id = String(v.id ?? v._id ?? "");
        const name = String(v.name ?? v._id ?? v.id ?? "Vacataire");
        const filename = v.filename ?? v.cv?.filename ?? null;
        const label = filename ? `${name} (${filename})` : name;
        return { id, name, filename, label };
      })
      .filter((v) => v.id);
  }, [vacataires]);

  const ALL_EXTERNAL_IDS = useMemo(() => externalPeople.map((p) => p.id), [externalPeople]);

  useEffect(() => {
    if (staffType === "internal") {
      setSelectedPeople([]);
      return;
    }
    if (selectedPeople.length === 0 && ALL_EXTERNAL_IDS.length > 0) {
      setSelectedPeople(ALL_EXTERNAL_IDS);
    } else {
      setSelectedPeople((prev) => prev.filter((id) => ALL_EXTERNAL_IDS.includes(id)));
    }
  }, [staffType, ALL_EXTERNAL_IDS.length]);

  const [selectedPeople, setSelectedPeople] = useState([]);
  const [extOpen, setExtOpen] = useState(false);
  const extRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (extOpen && extRef.current && !extRef.current.contains(e.target)) {
        setExtOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [extOpen]);

  const handleStart = async () => {
    setError("");
    setSsePayload(null);
    setFinalSummary(null);
    navigatedRef.current = false;

    const goToResultsWithDelay = async (finalPayload) => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;

      try {
        await refreshHistory();
        await refreshOffers();
      } catch (err) {
      }

      setLoading(false);
      setSsePayload((prev) => ({ ...(prev || {}), state: "done", stages: { ...(prev?.stages || {}), done: { percent: 100 } } }));

      setLoading(false);
      navigate("/matching-list", {
        state: {
          ok: !!finalPayload?.ok,
          job_description: finalPayload?.job_description || null,
          results: Array.isArray(finalPayload?.results) ? finalPayload.results : [],
        },
      });
    };

    try {
      setLoading(true);

      const excludedExternalIds =
        (staffType === "external" || staffType === "all")
          ? ALL_EXTERNAL_IDS.filter((id) => !selectedPeople.includes(id))
          : [];

      let jobFile;
      if (offerMode === "existing") {
        if (!selectedOfferId) {
          setError(t("err_select_offer", "Veuillez choisir une offre existante."));
          setLoading(false);
          return;
        }
        const offerDoc = offers.find((o) => String(o._id) === String(selectedOfferId));
        if (!offerDoc) {
          setError(t("err_select_offer", "Offre introuvable."));
          setLoading(false);
          return;
        }
        jobFile = { name: offerDoc.filename, isExistingOffer: true };
      } else {
        if (!uploadedFiles[0] || !(uploadedFiles[0].file instanceof File)) {
          setError(t("err_invalid_file", "Fichier invalide ou manquant."));
          setLoading(false);
          return;
        }
        jobFile = uploadedFiles[0].file;
      }

      const res = await uploadAnalysisAPI(
        jobFile,
        user?.email || "unknown@skema.edu",
        {
          candidateSource: staffType,
          department: selectedDep,
          saveResults: (saveDocs === "yes"),
          externalCVs: excludedExternalIds,
          offerMode,
          stream: true,
        },
        {
          onUpdate: (p) => {
            setSsePayload(p);

            const le = p?.last_event;
            if (!navigatedRef.current && le?.type === "result" && le?.payload) {
              setFinalSummary(le.payload);
              goToResultsWithDelay(le.payload);
            }
          },
          onResult: (finalPayload) => {
            if (!navigatedRef.current) {
              setFinalSummary(finalPayload);
              goToResultsWithDelay(finalPayload);
            }
          },
          onError: (e) => {
            setError(e?.message || "Erreur pendant le matching.");
            setLoading(false);
          },
        }
      );

      if (saveDocs === "yes") {
        try { await refreshHistory(); await refreshOffers(); } catch { }
      }

      if (!navigatedRef.current && res) {
        goToResultsWithDelay(res);
      }
    } catch (err) {
      setError(err?.message || t("err_generic", "Une erreur est survenue."));
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = (e.target.files && e.target.files[0]) || null;
    if (!file) return;

    const ext = (file.name.split(".").pop() || "").toLowerCase();
    if (!["pdf", "doc", "docx"].includes(ext)) {
      setError(t("err_invalid_file"));
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const formatted = {
      id: Date.now() + file.name,
      file,
      name: file.name,
      size: `${Math.round(file.size / 1024)}KB`,
      ext,
    };

    setUploadedFiles([formatted]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id) => {
    setUploadedFiles((prev) => prev.filter((f) => f.id !== id));
  };


  const PAGE_SIZE = 3;
  const [page, setPage] = useState(1);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((offers?.length || 0) / PAGE_SIZE)),
    [offers]
  );

  const start = (page - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pagedOffers = useMemo(() => (offers || []).slice(start, end), [offers, start, end]);

  useEffect(() => {
    if (!selectedOfferId || !(offers?.length)) return;
    const idx = offers.findIndex(o => String(o._id) === String(selectedOfferId));
    if (idx >= 0) {
      const targetPage = Math.floor(idx / PAGE_SIZE) + 1;
      if (targetPage !== page) setPage(targetPage);
    }
  }, [selectedOfferId, offers?.length]);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.filtersBlock}>
        <button
          className={styles.backButton}
          onClick={() => window.history.back()}
        >
          ← Retour
        </button>

        <h3 className={styles.filtersTitle}>
          {t("ut_filters_title", "Filtres rapides d’analyse")}
        </h3>
        <p className={styles.filtersSubtitle}>
          {t("ut_filters_subtitle", "Choisissez les paramètres avant de lancer l’analyse.")}
        </p>

        <div className={styles.filtersRow}>
          <PillSelect
            value={offerMode}
            onChange={(v) => setOfferMode(v)}
            options={[
              { value: "new", label: t("offer_mode_new", "Nouvelle offre (upload)") },
              { value: "existing", label: t("offer_mode_existing", "Offre existante") },
            ]}
            placeholder={t("offer_mode", "Mode d’offre")}
          />
          <PillSelect
            value={staffType}
            onChange={(val) => {
              setStaffType(val);
              if (val === "internal") setSelectedPeople([]);
            }}
            options={[
              { value: "all", label: t("source_all", "Interne + Externe") },
              { value: "internal", label: t("source_internal", "Interne seulement") },
              { value: "external", label: t("source_external", "Externe seulement") },
            ]}
            placeholder={t("ut_candidate_source", "Source des candidats")}
          />
          {(staffType === "internal" || staffType === "all") && (
            <PillSelect
              value={selectedDep}
              onChange={setSelectedDep}
              options={[
                { value: "All", label: t("dep_all", "Tous les départements") },
                { value: "EAP_Professors", label: t("dep_eap_professors", "EAP Professeurs") },
              ]}
              placeholder={t("ut_choose_department", "Département")}
            />
          )}
          {(staffType === "external" || staffType === "all") && (
            <MultiPillSelect
              values={selectedPeople}
              onChange={setSelectedPeople}
              options={externalPeople.map(p => ({ value: p.id, label: p.label }))}
              placeholder={t("ext_select_placeholder", "Sélectionner vacataires externes")}
            />
          )}
          {offerMode === "new" && (
            <PillSelect
              value={saveDocs}
              onChange={setSaveDocs}
              options={[
                { value: "yes", label: t("save_offer_true", "Oui, enregistrer l’offre") },
                { value: "no", label: t("save_offer_false", "Ne pas enregistrer") },
              ]}
              placeholder={t("ut_save_results", "Sauvegarde")}
            />
          )}
        </div>
      </div>
      <section className={`${styles.uploadCard} ${styles.appear}`}>
        <div className={styles.extTopRow}>
          <span className={styles.extSmallIcon} aria-hidden>
            <TbFiles />
          </span>
          <span className={styles.extTypePill}>PDF / DOCX / DOC</span>
        </div>

        <h3 className={styles.extTitle}>
          {offerMode === "existing"
            ? t("ut_use_existing", "Utiliser une offre existante")
            : t("ut_upload_a_file", "Importer un fichier")}
        </h3>

        <p className={styles.extDesc}>
          {offerMode === "existing"
            ? t(
              "ut_use_existing_desc",
              "Sélectionnez une offre déjà enregistrée dans la liste des filtres."
            )
            : t("ut_upload_desc", "Ajoutez votre fichier d’offre à analyser.")}
        </p>

        {offerMode === "existing" ? (
          <div className={styles.list}>
            {Array.isArray(offers) && offers.length > 0 ? (
              <>
                <ul className={styles.offerList} role="listbox" aria-label={t("select_existing_offer", "Choisir une offre existante")}>
                  {pagedOffers.map((o) => {
                    const id = String(o._id);
                    const selected = id === String(selectedOfferId);
                    const title = o.filename || id;
                    const summary =
                      o.job_info?.[lang]?.short_description?.summary ||
                      o.job_info?.[lang === "fr" ? "en" : "fr"]?.short_description?.summary ||
                      o.summary ||
                      "";
                    const createdAt = o.updated_at || o.created_at || "";
                    const formattedDate = createdAt
                      ? new Date(createdAt).toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                      : "";

                    return (
                      <li key={id} role="option" aria-selected={selected} className={styles.offerListItem}>
                        <button
                          type="button"
                          className={[styles.offerCard, selected ? styles.isActive : ""].join(" ").trim()}
                          onClick={() => setSelectedOfferId(id)}
                        >
                          <div className={styles.fileThumb} aria-hidden>
                            <AiOutlineFilePdf className={styles.fileThumbIcon} />
                          </div>

                          <div className={styles.offerBody}>
                            <div className={styles.offerTitle} title={title}>{title}</div>

                            <div className={styles.offerSummary}>
                              {summary ? (summary.length > 140 ? summary.slice(0, 140) + "…" : summary) : t("existing_offer_selected", "Une offre existante est sélectionnée.")}
                            </div>

                            <div className={styles.offerMeta}>
                              {formattedDate ? <span className={styles.offerMetaItem}>{formattedDate}</span> : null}
                            </div>
                          </div>

                          <div className={styles.offerRadioWrap}>
                            <input
                              type="radio"
                              className={styles.offerRadio}
                              name="existing-offer"
                              checked={selected}
                              onChange={() => setSelectedOfferId(id)}
                              aria-label={title}
                            />
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>

                {offers.length > PAGE_SIZE && (
                  <div className={styles.pagination}>
                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage(p => Math.max(1, p - 1))}
                      disabled={page === 1}
                      aria-label={t("prev_page", "Page précédente")}
                    >
                      ‹
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(pn => (
                      <button
                        key={pn}
                        type="button"
                        className={[styles.pageBtn, pn === page ? styles.pageActive : ""].join(" ").trim()}
                        onClick={() => setPage(pn)}
                        aria-current={pn === page ? "page" : undefined}
                      >
                        {pn}
                      </button>
                    ))}

                    <button
                      type="button"
                      className={styles.pageBtn}
                      onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      aria-label={t("next_page", "Page suivante")}
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={styles.fileMuted}>
                {t("existing_offer_none", "Aucune offre sélectionnée pour l’instant.")}
              </div>
            )}
          </div>
        ) : (
          <>
            <label className={styles.picker}>
              <div className={styles.pickLeft} aria-hidden>📄</div>
              <div className={styles.pickTexts}>
                <div className={styles.pickTitle}>{t("pick_title", "Sélectionner un fichier")}</div>
                <div className={styles.pickHint}>{t("pick_hint", "PDF, DOC ou DOCX — Taille max 20 Mo")}</div>
              </div>
              <input
                className={styles.fileInput}
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                ref={fileInputRef}
              />
            </label>

            <div className={styles.list}>
              {uploadedFiles.length === 0 ? (
                <div className={styles.fileMuted}>
                  {t("no_docs_yet", "Aucun document sélectionné pour l’instant.")}
                </div>
              ) : (
                (() => {
                  const { id, file } = uploadedFiles[0];
                  const match = ACCEPTED.find((a) => file?.name?.toLowerCase().endsWith(a.ext));
                  const Icon = match?.Icon || AiOutlineFilePdf;

                  return (
                    <div key={id} className={styles.fileRowModern}>
                      <div className={styles.fileThumb} aria-hidden>
                        <Icon className={styles.fileThumbIcon} />
                      </div>

                      <div className={styles.fileInfo}>
                        <div className={styles.fileName} title={file.name}>
                          {file.name}
                        </div>
                        <div className={styles.fileSize}>{(file.size / 1024).toFixed(2)} KB</div>
                      </div>

                      <div className={styles.fileActions}>
                        <button
                          className={styles.fileActionBtn}
                          onClick={() => removeFile(id)}
                          title={t("remove_file", "Retirer le fichier")}
                          aria-label={t("remove_file", "Retirer le fichier")}
                        >
                          <MdClose />
                        </button>
                      </div>
                    </div>
                  );
                })()
              )}
            </div>
          </>
        )}
      </section>

      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.actionBar}>
        {!loading && (
          <button
            className={styles.startBtn}
            disabled={
              offerMode === "new"
                ? uploadedFiles.length === 0
                : !selectedOfferId
            }
            onClick={handleStart}
          >
            {t("start", "Commencer")}
          </button>
        )}
      </div>

      {loading && (
        <div className={styles.progressPanel}>
          <ProcessMatching
            stages={ssePayload?.stages || {}}
            jobState={ssePayload?.state || (loading ? "running" : undefined)}
            errorText={ssePayload?.error || ""}
            httpStatus={ssePayload?.httpStatus}
          />
          {ssePayload?.error && (
            <p className={styles.error}>⚠️ {ssePayload.error}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadTraitement;
