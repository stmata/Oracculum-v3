import React, { useMemo, useState, useEffect, useRef } from "react";
import styles from "./EditInternalPage.module.css";
import { useTranslation } from "../../../../../../../../utils/useTranslation";
import { LiaChalkboardTeacherSolid } from "react-icons/lia";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { SiAdminer } from "react-icons/si";
import { AiOutlineAlert } from "react-icons/ai";
import { PiFileCsvDuotone } from "react-icons/pi";
import { useCandidatesData } from "../../../../../../../../context/CandidatesDataContext";
import { useAppContext } from "../../../../../../../../context/AppContext";
import ProcessSteps from "./ProcessSteps/ProcessSteps";

const DONE_TTL_MS = 5_000;
const ERROR_TTL_MS = 5_000;

export default function EditInternalPage() {
  const { t } = useTranslation();
  const { user } = useAppContext();

  const [selectedKind, setSelectedKind] = useState(null);
  const [allMode, setAllMode] = useState(false);

  const { importAndRefresh, updating, jobState, stages } = useCandidatesData();

  const [fileProf, setFileProf] = useState(null);
  const [fileAdmin, setFileAdmin] = useState(null);
  const [fileEnt, setFileEnt] = useState(null);

  const [filePub, setFilePub] = useState(null);
  const [fileResearch, setFileResearch] = useState(null);
  const [fileTeaching, setFileTeaching] = useState(null);

  const [showProcess, setShowProcess] = useState(false);
  const [localJobState, setLocalJobState] = useState(null);
  const [optimisticStages, setOptimisticStages] = useState(null);

  const [inputKeys, setInputKeys] = useState({
    prof: 0,
    admin: 0,
    ent: 0,
    pub: 0,
    research: 0,
    teaching: 0,
  });

  const bumpInputKey = (kind) =>
    setInputKeys((k) => ({ ...k, [kind]: (k[kind] || 0) + 1 }));

  const resetAllInputs = () =>
    setInputKeys((k) => ({
      prof: k.prof + 1,
      admin: k.admin + 1,
      ent: k.ent + 1,
      pub: k.pub + 1,
      research: k.research + 1,
      teaching: k.teaching + 1,
    }));

  const hideTimerRef = useRef(null);
  const clearHideTimer = () => {
    if (hideTimerRef.current) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  };

  const effectiveJobState = localJobState || jobState;
  const isBusy =
    effectiveJobState && effectiveJobState !== "done" && effectiveJobState !== "error";
  const canEditTeachers =
    String(user?.access_scope || "").toLowerCase().trim() === "all";

  useEffect(() => {
    if (!jobState) return;

    setShowProcess(true);
    setLocalJobState(jobState === "running" ? "running" : jobState);
    clearHideTimer();

    if (jobState === "done" || jobState === "error") {
      const ttl = jobState === "done" ? DONE_TTL_MS : ERROR_TTL_MS;
      hideTimerRef.current = window.setTimeout(() => {
        setShowProcess(false);
        setLocalJobState(null);
        setOptimisticStages(null);

        setFileProf(null);
        setFileAdmin(null);
        setFileEnt(null);
        setFilePub(null);
        setFileResearch(null);
        setFileTeaching(null);
        resetAllInputs();
      }, ttl);
    }

    return clearHideTimer;
  }, [jobState]);

  useEffect(() => {
    if (!stages) return;
    setOptimisticStages(stages);
  }, [stages]);

  const setFileForKind = (kind, f) => {
    if (kind === "prof") setFileProf(f);
    if (kind === "admin") setFileAdmin(f);
    if (kind === "ent") setFileEnt(f);
  };

  const file = useMemo(() => {
    if (selectedKind === "prof") return fileProf;
    if (selectedKind === "admin") return fileAdmin;
    if (selectedKind === "ent") return fileEnt;
    return null;
  }, [selectedKind, fileProf, fileAdmin, fileEnt]);

  const meta = useMemo(() => {
    if (selectedKind === "prof") {
      return {
        title: t("upload_prof_title", "Jeu de données — Professeurs"),
        desc: t(
          "upload_prof_desc",
          "Importez le fichier consolidé des professeurs et leurs fichiers de publications, intérêts de recherche et intérêts d’enseignement."
        ),
        IconComponent: LiaChalkboardTeacherSolid,
      };
    }
    if (selectedKind === "admin") {
      return {
        title: t("upload_admin_title", "Jeu de données — Administratifs"),
        desc: t(
          "upload_admin_desc",
          "Ajoutez le fichier du personnel administratif (EAP Administratifs)."
        ),
        IconComponent: MdOutlineAdminPanelSettings,
      };
    }
    if (selectedKind === "ent") {
      return {
        title: t("upload_ent_title", "Entretiens Professionnels"),
        desc: t(
          "upload_ent_desc",
          "Chargez le relevé des entretiens professionnels (EAP Entretiens)."
        ),
        IconComponent: SiAdminer,
      };
    }
    return null;
  }, [selectedKind, t]);

  const canProcessSimple =
    selectedKind === "prof"
      ? Boolean(fileProf && filePub && fileResearch && fileTeaching)
      : Boolean(selectedKind && file);

  const allPickedCount = [fileProf, fileAdmin, fileEnt].filter(Boolean).length;
  const canProcessAll = allPickedCount === 3;

  const handleRunSingle = async () => {
    if (!selectedKind) return;

    if (
      selectedKind === "prof" &&
      !(fileProf && filePub && fileResearch && fileTeaching)
    ) {
      return;
    }

    setShowProcess(true);
    setLocalJobState("running");
    setOptimisticStages({
      import: { percent: 0 },
      save: { percent: 0 },
      summaries: { percent: 0 },
      clustering: { percent: 0 },
    });

    let payload = {
      kind: selectedKind,
      prof: selectedKind === "prof" ? fileProf : null,
      admin: selectedKind === "admin" ? fileAdmin : null,
      ent: selectedKind === "ent" ? fileEnt : null,
    };

    if (selectedKind === "prof") {
      payload = {
        ...payload,
        publication: filePub,
        iresearch: fileResearch,
        teaching: fileTeaching,
      };
    }

    if (selectedKind === "prof") {
      bumpInputKey("prof");
      bumpInputKey("pub");
      bumpInputKey("research");
      bumpInputKey("teaching");
    } else {
      bumpInputKey(selectedKind);
    }

    await importAndRefresh(payload);
  };

  const handleRunAll = async () => {
    if (!(fileProf && fileAdmin && fileEnt)) return;

    setShowProcess(true);
    setLocalJobState("running");
    setOptimisticStages({
      import: { percent: 0 },
      save: { percent: 0 },
      summaries: { percent: 0 },
      clustering: { percent: 0 },
    });

    resetAllInputs();
    await importAndRefresh({
      prof: fileProf,
      admin: fileAdmin,
      ent: fileEnt,
    });
  };

  const stepsStages =
    optimisticStages || {
      import: { percent: 0 },
      save: { percent: 0 },
      summaries: { percent: 0 },
      clustering: { percent: 0 },
    };
  const stepsJobState = jobState || localJobState || null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button
          className={styles.backButton}
          onClick={() => window.history.back()}
        >
          ← {t("back", "Changer de type")}
        </button>
        <h1 className={styles.title}>
          {t("internal_edit_title", "Traitement Interne")}
        </h1>
        <div className={styles.headerRight}>
          <button
            className={`${styles.toggleAllBtn} ${styles.toggleSoon}`}
            disabled
          >
            {t("all_on", "Tout sélectionner")}
          </button>

          <span className={styles.soonBadge}>
            {t("coming_soon", "À venir")}
          </span>
        </div>
      </header>

      {allMode ? (
        <>
          <div className={styles.notice} role="status">
            <AiOutlineAlert className={styles.noticeIcon} aria-hidden="true" />
            <span className={styles.noticeText}>
              {t(
                "internal_edit_notice",
                "Le traitement peut prendre quelques minutes. Vous recevrez un récapitulatif à la fin."
              )}
            </span>
          </div>

          <button
            className={styles.backLink2}
            onClick={() => setAllMode(false)}
            aria-label={t("back", "Changer de type")}
          >
            ← {t("back", "Changer de type")}
          </button>

          <section className={styles.centerWrap}>
            <div className={styles.tripleWrap}>
              {[
                {
                  kind: "prof",
                  title: t(
                    "upload_prof_title",
                    "Jeu de données — Professeurs"
                  ),
                  desc: t(
                    "upload_prof_desc",
                    "Importez le fichier consolidé des professeurs (EAP Professeurs)."
                  ),
                  IconComponent: LiaChalkboardTeacherSolid,
                  file: fileProf,
                  setter: setFileProf,
                },
                {
                  kind: "admin",
                  title: t(
                    "upload_admin_title",
                    "Jeu de données — Administratifs"
                  ),
                  desc: t(
                    "upload_admin_desc",
                    "Ajoutez le fichier du personnel administratif (EAP Administratifs)."
                  ),
                  IconComponent: MdOutlineAdminPanelSettings,
                  file: fileAdmin,
                  setter: setFileAdmin,
                },
                {
                  kind: "ent",
                  title: t(
                    "upload_ent_title",
                    "Entretiens Professionnels"
                  ),
                  desc: t(
                    "upload_ent_desc",
                    "Chargez le relevé des entretiens professionnels (EAP Entretiens)."
                  ),
                  IconComponent: SiAdminer,
                  file: fileEnt,
                  setter: setFileEnt,
                },
              ].map(({ kind, title, desc, IconComponent, file, setter }) => (
                <article
                  key={kind}
                  className={`${styles.uploadCard} ${styles.uploadCardNarrow} ${styles.appear}`}
                >
                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>
                        <IconComponent />
                      </span>
                      {title}
                    </h2>
                  </div>
                  <p className={styles.cardDesc}>{desc}</p>

                  <label className={styles.picker}>
                    <div className={styles.pickLeft} aria-hidden>
                      📄
                    </div>
                    <div className={styles.pickTexts}>
                      <div className={styles.pickTitle}>
                        {t("pick_title", "Sélectionner un fichier")}
                      </div>
                      <div className={styles.pickHint}>
                        {t("pick_hint", "Taille max 20 Mo • .csv")}
                      </div>
                    </div>
                    <input
                      key={inputKeys[kind]}
                      className={styles.fileInput}
                      type="file"
                      accept=".csv"
                      onChange={(e) => setter(e.target.files?.[0] || null)}
                      disabled={isBusy || updating}
                    />
                  </label>

                  <div className={styles.fileNameRow}>
                    {file ? (
                      <span className={styles.fileChip} title={file.name}>
                        <PiFileCsvDuotone /> {file.name}
                      </span>
                    ) : (
                      <span className={styles.fileNameMuted}>
                        {t("pick_none", "Aucun fichier sélectionné")}
                      </span>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <footer className={`${styles.actions} ${styles.actionsCenter}`}>
              <button
                className={styles.primaryBtn2}
                disabled={!canProcessAll || updating || isBusy}
                onClick={handleRunAll}
              >
                {updating || isBusy
                  ? t("actions_processing", "Traitement…")
                  : t("actions_process", "Lancer le traitement")}
              </button>
            </footer>
          </section>

          {showProcess && (
            <ProcessSteps
              variant="internal"
              jobState={stepsJobState}
              stages={stepsStages}
            />
          )}
        </>
      ) : (
        <>
          {!selectedKind ? (
            <>
              <p className={styles.lead}>
                {t(
                  "internal_edit_lead",
                  "Choisissez le type de données à traiter."
                )}
              </p>

              <section className={styles.choiceGrid} role="list">
                {[
                  {
                    kind: "prof",
                    title: t("choice_prof", "Professeurs"),
                    sub: t(
                      "choice_prof_sub",
                      "Base enseignants et données académiques"
                    ),
                    desc: t(
                      "choice_prof_desc",
                      "Contient les informations sur les professeurs, leurs cours, leurs performances et leurs évaluations."
                    ),
                    IconComponent: LiaChalkboardTeacherSolid,
                  },
                  {
                    kind: "admin",
                    title: t("choice_admin", "Administratifs"),
                    sub: t(
                      "choice_admin_sub",
                      "Personnel et services de gestion"
                    ),
                    desc: t(
                      "choice_admin_desc",
                      "Regroupe les données du personnel administratif et des fonctions de support."
                    ),
                    IconComponent: MdOutlineAdminPanelSettings,
                  },
                  {
                    kind: "ent",
                    title: t("choice_ent", "Entretiens"),
                    sub: t(
                      "choice_ent_sub",
                      "Suivi des entretiens professionnels"
                    ),
                    desc: t(
                      "choice_ent_desc",
                      "Objectifs fixés, retours qualitatifs et besoins en formation."
                    ),
                    IconComponent: SiAdminer,
                  },
                ].map(({ kind, title, sub, desc, IconComponent }) => {
                  const isComingSoon = kind === "admin" || kind === "ent";
                  const lockedByScope = kind === "prof" && !canEditTeachers;

                  const disabledCard =
                    isBusy || updating || isComingSoon || lockedByScope;

                  const isLocked = lockedByScope;
                  const isFullyDisabled = disabledCard && !lockedByScope;

                  return (
                    <button
                      key={kind}
                      data-kind={kind}
                      className={`
                        ${styles.choiceCard}
                        ${isFullyDisabled ? styles.choiceCardDisabled : ""}
                        ${isLocked ? styles.choiceCardLocked : ""}
                      `}
                      role="listitem"
                      onClick={() => {
                        if (disabledCard) return;
                        setSelectedKind(kind);
                      }}
                      disabled={disabledCard}
                      aria-disabled={disabledCard}
                    >

                      <div className={styles.choiceIcon}>
                        <IconComponent />
                      </div>
                      <div className={styles.choiceBody}>
                        <h3 className={styles.choiceTitle}>{title}</h3>
                        <p className={styles.choiceSubtitle}>{sub}</p>
                        <p className={styles.choiceDesc}>{desc}</p>
                      </div>

                      <div className={styles.choiceBadgeWrap}>
                        <span className={styles.choiceBadge}>
                          CSV • 20 Mo max
                        </span>

                        {isComingSoon && (
                          <span className={styles.choiceSoon}>
                            {t("coming_soon", "Bientôt disponible")}
                          </span>
                        )}

                        {lockedByScope &&
                          (() => {
                            const taglock =
                              t(
                                "taglock",
                                "Accès restreint\nContactez votre administrateur."
                              ) || "";
                            const [line1, line2] = taglock.split("\n");

                            return (
                              <div className={styles.lockTag}>
                                {line1}
                                {line2 && (
                                  <>
                                    <br />
                                    {line2}
                                  </>
                                )}
                              </div>
                            );
                          })()}
                      </div>
                    </button>
                  );
                })}
              </section>
            </>
          ) : (
            <>
              <div className={styles.notice} role="status">
                <AiOutlineAlert
                  className={styles.noticeIcon}
                  aria-hidden="true"
                />
                <span className={styles.noticeText}>
                  {t(
                    "internal_edit_notice",
                    "Le traitement peut prendre quelques minutes. Vous recevrez un récapitulatif à la fin."
                  )}
                </span>
              </div>

              <section className={styles.centerWrap}>
                <article className={`${styles.uploadCard} ${styles.appear}`}>
                  <button
                    className={styles.backLink}
                    onClick={() => {
                      if (isBusy) return;
                      const k = selectedKind;
                      setSelectedKind(null);
                      if (k) setFileForKind(k, null);
                    }}
                    aria-label={t("back", "Changer de type")}
                    disabled={isBusy || updating}
                  >
                    ← {t("back", "Changer de type")}
                  </button>

                  <div className={styles.cardHead}>
                    <h2 className={styles.cardTitle}>
                      <span className={styles.cardIcon}>
                        {meta?.IconComponent ? <meta.IconComponent /> : null}
                      </span>
                      {meta?.title}
                    </h2>
                  </div>

                  <p className={styles.cardDesc}>{meta?.desc}</p>

                  <label className={styles.picker}>
                    <div className={styles.pickLeft} aria-hidden>
                      📄
                    </div>
                    <div className={styles.pickTexts}>
                      <div className={styles.pickTitle}>
                        {t("pick_title", "Sélectionner un fichier")}
                      </div>
                      <div className={styles.pickHint}>
                        {t("pick_hint", "Taille max 20 Mo • .csv")}
                      </div>
                    </div>
                    <input
                      key={selectedKind ? inputKeys[selectedKind] : 0}
                      className={styles.fileInput}
                      type="file"
                      accept=".csv"
                      onChange={(e) =>
                        setFileForKind(
                          selectedKind,
                          e.target.files?.[0] || null
                        )
                      }
                      disabled={isBusy || updating}
                    />
                  </label>

                  <div className={styles.fileNameRow2}>
                    {file ? (
                      <span className={styles.fileChip} title={file.name}>
                        <PiFileCsvDuotone /> {file.name}
                      </span>
                    ) : (
                      <span className={styles.fileNameMuted}>
                        {t("pick_none", "Aucun fichier sélectionné")}
                      </span>
                    )}
                  </div>

                  {selectedKind === "prof" && (
                    <div className={styles.extraFilesGroup}>
                      <label className={styles.picker}>
                        <div className={styles.pickLeft} aria-hidden>
                          📄
                        </div>
                        <div className={styles.pickTexts}>
                          <div className={styles.pickTitle}>
                            {t(
                              "pick_pub_title",
                              "Fichier des publications"
                            )}
                          </div>
                          <div className={styles.pickHint}>
                            {t("pick_hint", "Taille max 20 Mo • .csv")}
                          </div>
                        </div>
                        <input
                          key={inputKeys.pub}
                          className={styles.fileInput}
                          type="file"
                          accept=".csv"
                          onChange={(e) =>
                            setFilePub(e.target.files?.[0] || null)
                          }
                          disabled={isBusy || updating}
                        />
                      </label>
                      <div className={styles.fileNameRow}>
                        {filePub ? (
                          <span
                            className={styles.fileChip}
                            title={filePub.name}
                          >
                            <PiFileCsvDuotone /> {filePub.name}
                          </span>
                        ) : (
                          <span className={styles.fileNameMuted}>
                            {t("pick_none", "Aucun fichier sélectionné")}
                          </span>
                        )}
                      </div>

                      <label className={styles.picker}>
                        <div className={styles.pickLeft} aria-hidden>
                          📄
                        </div>
                        <div className={styles.pickTexts}>
                          <div className={styles.pickTitle}>
                            {t(
                              "pick_research_title",
                              "Fichier des intérêts de recherche"
                            )}
                          </div>
                          <div className={styles.pickHint}>
                            {t("pick_hint", "Taille max 20 Mo • .csv")}
                          </div>
                        </div>
                        <input
                          key={inputKeys.research}
                          className={styles.fileInput}
                          type="file"
                          accept=".csv"
                          onChange={(e) =>
                            setFileResearch(e.target.files?.[0] || null)
                          }
                          disabled={isBusy || updating}
                        />
                      </label>
                      <div className={styles.fileNameRow}>
                        {fileResearch ? (
                          <span
                            className={styles.fileChip}
                            title={fileResearch.name}
                          >
                            <PiFileCsvDuotone /> {fileResearch.name}
                          </span>
                        ) : (
                          <span className={styles.fileNameMuted}>
                            {t("pick_none", "Aucun fichier sélectionné")}
                          </span>
                        )}
                      </div>

                      <label className={styles.picker}>
                        <div className={styles.pickLeft} aria-hidden>
                          📄
                        </div>
                        <div className={styles.pickTexts}>
                          <div className={styles.pickTitle}>
                            {t(
                              "pick_teaching_title",
                              "Fichier des intérêts d’enseignement"
                            )}
                          </div>
                          <div className={styles.pickHint}>
                            {t("pick_hint", "Taille max 20 Mo • .csv")}
                          </div>
                        </div>
                        <input
                          key={inputKeys.teaching}
                          className={styles.fileInput}
                          type="file"
                          accept=".csv"
                          onChange={(e) =>
                            setFileTeaching(e.target.files?.[0] || null)
                          }
                          disabled={isBusy || updating}
                        />
                      </label>
                      <div className={styles.fileNameRow}>
                        {fileTeaching ? (
                          <span
                            className={styles.fileChip}
                            title={fileTeaching.name}
                          >
                            <PiFileCsvDuotone /> {fileTeaching.name}
                          </span>
                        ) : (
                          <span className={styles.fileNameMuted}>
                            {t("pick_none", "Aucun fichier sélectionné")}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <footer className={styles.actions}>
                    <button
                      className={styles.primaryBtn}
                      disabled={!canProcessSimple || updating || isBusy}
                      onClick={handleRunSingle}
                    >
                      {updating || isBusy
                        ? t("actions_processing", "Traitement…")
                        : t("actions_process", "Lancer le traitement")}
                    </button>
                  </footer>
                </article>
              </section>

              {showProcess && (
                <ProcessSteps
                  variant="internal"
                  jobState={stepsJobState}
                  stages={stepsStages}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
