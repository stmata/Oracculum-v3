import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import styles from "./ManageExternalPage.module.css";
import { useTranslation } from "../../../../../../../../utils/useTranslation";
import { AiOutlineFilePdf } from "react-icons/ai";
import { PiFileDocBold, PiReadCvLogo } from "react-icons/pi";
import { MdClose } from "react-icons/md";
import { useVacatairesData } from "../../../../../../../../context/VacatairesDatasContext";
import ProcessSteps from "../EditInternalPage/ProcessSteps/ProcessSteps";
import { useCandidatesData } from "../../../../../../../../context/CandidatesDataContext";

const ACCEPTED = [
  { mime: "application/pdf", ext: ".pdf", Icon: AiOutlineFilePdf },
  {
    mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ext: ".docx",
    Icon: PiFileDocBold,
  },
  { mime: "application/msword", ext: ".doc", Icon: PiFileDocBold },
];

const STAGE_ALIAS = {
  parsing: ["vac_upload", "upload", "reading", "parsing"],
  summaries: ["vac_summaries", "summaries"],
  clustering: ["vac_cluster", "cluster", "clustering", "vac_clustering"],
  saving: ["vac_saving", "saving", "db_upserted"],
};

function foldStage(stages, stageName, progress, extra = {}) {
  const next = { ...(stages || {}) };
  const lower = String(stageName || "").toLowerCase();

  const setBucket = (k) => {
    next[k] = {
      ...(next[k] || {}),
      percent: Number.isFinite(progress) ? progress : next[k]?.percent ?? 0,
      ...extra,
    };
  };

  if (STAGE_ALIAS.parsing.some((a) => lower.includes(a))) setBucket("parsing");
  else if (STAGE_ALIAS.summaries.some((a) => lower.includes(a)))
    setBucket("summaries");
  else if (STAGE_ALIAS.clustering.some((a) => lower.includes(a)))
    setBucket("clustering");
  else if (STAGE_ALIAS.saving.some((a) => lower.includes(a)))
    setBucket("saving");
  else
    next[lower || "unknown"] = {
      percent: Number(progress) || 0,
      ...extra,
    };

  return next;
}

const mapVacStages = (stages) => ({
  parsing: {
    percent:
      stages?.parsing?.percent ??
      stages?.vac_upload?.percent ??
      stages?.upload?.percent ??
      0,
  },
  summaries: {
    percent: stages?.summaries?.percent ?? stages?.vac_summaries?.percent ?? 0,
  },
  clustering: {
    percent: stages?.clustering?.percent ?? stages?.vac_cluster?.percent ?? 0,
  },
  saving: {
    percent: stages?.saving?.percent ?? stages?.vac_saving?.percent ?? 0,
  },
});

const percentFromStages = (stages) => {
  if (!stages || typeof stages !== "object") return null;
  const vals = Object.values(stages)
    .map((s) => (s && typeof s.percent === "number" ? s.percent : null))
    .filter((x) => x !== null);
  if (!vals.length) return null;
  const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
  return Math.max(0, Math.min(100, avg));
};

export default function ManageExternalPage() {
  const { t } = useTranslation();
  const inputRef = useRef(null);
  const { uploadCVs, openStreams } = useVacatairesData();
  const { refresh: refreshCandidates } = useCandidatesData();

  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  const streamsCleanupRef = useRef(null);
  const cardTimersRef = useRef(new Map());
  const DONE_TTL_MS = 5_000;
  const ERROR_TTL_MS = 5_000;

  const clearFilePicker = useCallback(() => {
    if (inputRef.current) inputRef.current.value = "";
  }, []);

  const acceptAttr = useMemo(
    () => ACCEPTED.map((a) => a.ext).join(","),
    []
  );

  const getId = (f) => `${f.name}-${f.size}-${f.lastModified}`;

  const isAccepted = (f) => {
    if (!f) return false;
    const name = f.name?.toLowerCase() || "";
    const type = f.type || "";
    return (
      ACCEPTED.some((a) => name.endsWith(a.ext)) ||
      ACCEPTED.some((a) => a.mime === type)
    );
  };

  const scheduleDoneRemoval = useCallback((jobId) => {
    if (!jobId) return;
    const m = cardTimersRef.current;
    if (m.has(jobId)) clearTimeout(m.get(jobId));
    const t = setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.jobId !== jobId));
      m.delete(jobId);
    }, DONE_TTL_MS);
    m.set(jobId, t);
  }, []);

  const scheduleErrorRemoval = useCallback((localId) => {
    if (!localId) return;
    const m = cardTimersRef.current;
    if (m.has(localId)) clearTimeout(m.get(localId));
    const t = setTimeout(() => {
      setItems((prev) => prev.filter((it) => it.id !== localId));
      m.delete(localId);
    }, ERROR_TTL_MS);
    m.set(localId, t);
  }, []);

  const mergeFiles = useCallback((files) => {
    if (!files?.length) return;
    const valid = files.filter(isAccepted);
    if (valid.length === 0) return;

    setItems((prev) => {
      const map = new Map(prev.map((it) => [it.id, it]));
      for (const f of valid) {
        const id = getId(f);
        if (!map.has(id)) {
          map.set(id, {
            id,
            file: f,
            status: "idle",
            progress: 0,
            stages: {},
          });
        }
      }
      return Array.from(map.values());
    });
  }, []);

  const onInputChange = (e) => {
    const files = Array.from(e.target.files || []);
    mergeFiles(files);
    e.target.value = "";
  };

  const onDrop = (e) => {
    e.preventDefault();
    mergeFiles(Array.from(e.dataTransfer?.files || []));
  };

  const removeOne = (id) =>
    setItems((prev) => prev.filter((it) => it.id !== id));

  const handleSseEvent = useCallback(
    (jobId, type, payload) => {
      setItems((prev) => {
        const t =
          type || payload?.last_event?.type || payload?.type || "update";
        const rawError =
          payload?.error || payload?.last_event?.error || payload?.detail;

        const isDupMsg = (msg) =>
          /existe déjà|already exists|doublon|Vacataire déjà existant/i.test(
            String(msg || "")
          );

        if (t === "vac_file_error") {
          const filename = payload?.filename;

          return prev.map((it) => {
            if (!it.file || it.file.name !== filename) return it;

            const niceName = filename || it.file?.name;
            const isDup = isDupMsg(rawError);
            const msg = isDup
              ? `Le CV « ${niceName} » existe déjà (doublon).`
              : rawError || "Erreur sur ce CV.";

            const mergedStages = foldStage(
              it.stages,
              "vac_upload",
              it.stages?.parsing?.percent ?? 10,
              { error: msg }
            );

            scheduleErrorRemoval(it.id);

            return {
              ...it,
              status: "error",
              error: msg,
              httpStatus: isDup ? 409 : it.httpStatus,
              errorStage: "upload_or_read",
              stages: mergedStages,
              progress: percentFromStages(mergedStages) ?? it.progress,
            };
          });
        }

        if (
          t === "vac_ingest_error" ||
          t === "vac_pipeline_error" ||
          t === "error" ||
          (rawError && t !== "done")
        ) {
          return prev.map((it) => {
            if (it.jobId !== jobId) return it;

            const niceName =
              payload?.filename || it.file?.name || "Ce CV";
            const isDup = isDupMsg(rawError);
            const msg = isDup
              ? `Le CV « ${niceName} » existe déjà (doublon).`
              : rawError || "Erreur lors du traitement de ce CV.";

            const mergedStages = foldStage(
              it.stages,
              "vac_upload",
              it.stages?.parsing?.percent ?? 10,
              { error: msg }
            );

            scheduleErrorRemoval(it.id);

            return {
              ...it,
              status: "error",
              error: msg,
              httpStatus: isDup ? 409 : it.httpStatus,
              errorStage: "upload_or_read",
              stages: mergedStages,
              progress: percentFromStages(mergedStages) ?? it.progress,
            };
          });
        }

        return prev.map((it) => {
          if (it.jobId !== jobId) return it;

          const pipePct = Number(
            payload?.stages?.vac_pipeline?.percent ?? NaN
          );
          if (!Number.isNaN(pipePct) && t === "update") {
            const merged = {
              ...(it.stages || {}),
              vac_pipeline: { percent: pipePct },
            };
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress ?? 10,
            };
          }

          if (
            t === "stage" ||
            (t === "update" && (payload?.stage || payload?.progress))
          ) {
            const progress = Number(payload?.progress) || 0;
            const stageName = String(
              payload?.stage || payload?.last_event?.stage || ""
            );
            const mergedStages = foldStage(
              it.stages,
              stageName,
              progress,
              payload
            );
            const global =
              percentFromStages(mergedStages) ?? it.progress ?? 10;
            return {
              ...it,
              status: "processing",
              stages: mergedStages,
              progress: global,
            };
          }

          if (t === "vac_parse_start") {
            const merged = foldStage(
              it.stages,
              "vac_upload",
              Math.max(10, it.stages?.parsing?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_parsed") {
            const merged = foldStage(
              it.stages,
              "vac_upload",
              Math.max(35, it.stages?.parsing?.percent ?? 10),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_llm_start") {
            const merged = foldStage(
              it.stages,
              "vac_summaries",
              Math.max(50, it.stages?.summaries?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_llm_extracted") {
            let merged = foldStage(
              it.stages,
              "vac_summaries",
              100,
              payload
            );
            merged = foldStage(
              merged,
              "vac_cluster",
              Math.max(20, merged?.clustering?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_embedding_start" || t === "vac_embed_debug") {
            const merged = foldStage(
              it.stages,
              "vac_summaries",
              Math.max(70, it.stages?.summaries?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_assign_start") {
            const merged = foldStage(
              it.stages,
              "vac_cluster",
              Math.max(20, it.stages?.clustering?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_assign_done") {
            const merged = foldStage(
              it.stages,
              "vac_cluster",
              Math.max(80, it.stages?.clustering?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_cluster_start") {
            const merged = foldStage(
              it.stages,
              "vac_cluster",
              Math.max(40, it.stages?.clustering?.percent ?? 0),
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_cluster_done") {
            const merged = foldStage(
              it.stages,
              "vac_cluster",
              100,
              payload
            );
            return {
              ...it,
              status: "processing",
              stages: merged,
              progress: percentFromStages(merged) ?? it.progress,
            };
          }

          if (t === "vac_file_done") {
            return it;
          }

          if (t === "done" || payload?.type === "done") {
            const mergedStages = {
              ...(it.stages || {}),
              parsing: { percent: 100 },
              summaries: {
                percent: Math.max(100, it.stages?.summaries?.percent || 0),
              },
              clustering: {
                percent: Math.max(100, it.stages?.clustering?.percent || 0),
              },
              saving: { percent: 100 },
            };
            scheduleDoneRemoval(jobId);
            if (typeof refreshCandidates === "function") {
              refreshCandidates();
            }
            return {
              ...it,
              status: "done",
              stages: mergedStages,
              progress: 100,
            };
          }

          return it;
        });
      });
    },
    [scheduleDoneRemoval, scheduleErrorRemoval]
  );

  const onUpload = useCallback(
    async () => {
      const idleFiles = items
        .filter((it) => it.status === "idle")
        .map((it) => it.file);
      if (idleFiles.length === 0) return;

      setBusy(true);

      setItems((prev) =>
        prev.map((it) =>
          it.status === "idle"
            ? { ...it, status: "uploading", progress: 1 }
            : it
        )
      );

      try {
        const res = await uploadCVs(idleFiles, {
          reclusterAfter: true,
          sourceLabel: "Vacataires",
        });

        if (!res?.ok || !res.data) {
          const detail =
            res?.error ||
            res?.data?.detail ||
            "Erreur lors de l’upload.";
          setItems((prev) =>
            prev.map((it) => {
              if (it.status !== "uploading") return it;

              const isDup = /existe déjà|already exists|doublon|Vacataire déjà existant/i.test(
                String(detail)
              );
              const msg = isDup
                ? `Le CV « ${it.file?.name} » existe déjà (doublon).`
                : detail;

              const mergedStages = foldStage(it.stages, "vac_upload", 10, {
                error: msg,
              });

              scheduleErrorRemoval(it.id);
              clearFilePicker();

              return {
                ...it,
                status: "error",
                error: msg,
                httpStatus: res?.status ?? 0,
                errorStage: "upload_or_read",
                stages: mergedStages,
                progress: percentFromStages(mergedStages) ?? 0,
              };
            })
          );
          return;
        }

        const jobId = res.data.job_id || null;
        const accepted = Array.isArray(res.data.accepted)
          ? res.data.accepted
          : [];
        const rejected = Array.isArray(res.data.rejected)
          ? res.data.rejected
          : [];
        const duplicates = Array.isArray(res.data.duplicates)
          ? res.data.duplicates
          : [];

        const acceptedByName = new Map(
          accepted.map((r) => [r.filename, r])
        );
        const rejectedByName = new Map(
          rejected.map((r) => [r.filename, r])
        );
        const duplicatesByName = new Map(
          duplicates.map((d) => [d.filename, d])
        );

        setItems((prev) =>
          prev.map((it) => {
            if (it.status !== "uploading") return it;
            const fname = it.file?.name;

            if (duplicatesByName.has(fname)) {
              const dup = duplicatesByName.get(fname);
              const reason = dup?.reason || "duplicate";
              let msg;

              if (reason === "exists_in_db") {
                msg = `Le CV « ${fname} » existe déjà dans la base (vacataire: ${dup?.collab_key || "existant"
                  }).`;
              } else if (reason === "duplicate_in_batch") {
                msg = `Le CV « ${fname} » est en doublon dans ce lot d’upload.`;
              } else {
                msg = `Le CV « ${fname} » est en doublon.`;
              }

              const mergedStages = foldStage(
                it.stages,
                "vac_upload",
                10,
                { error: msg }
              );

              scheduleErrorRemoval(it.id);
              clearFilePicker();

              return {
                ...it,
                status: "error",
                error: msg,
                httpStatus: 409,
                errorStage: "upload_or_read",
                stages: mergedStages,
                progress: percentFromStages(mergedStages) ?? 0,
              };
            }

            if (rejectedByName.has(fname)) {
              const rej = rejectedByName.get(fname);
              const reason = rej?.reason || "rejected";
              let msg;
              if (reason === "empty_file") {
                msg = `Le fichier « ${fname} » est vide.`;
              } else {
                msg = `Le fichier « ${fname} » a été rejeté (${reason}).`;
              }

              const mergedStages = foldStage(
                it.stages,
                "vac_upload",
                10,
                { error: msg }
              );

              scheduleErrorRemoval(it.id);
              clearFilePicker();

              return {
                ...it,
                status: "error",
                error: msg,
                httpStatus: 400,
                errorStage: "upload_or_read",
                stages: mergedStages,
                progress: percentFromStages(mergedStages) ?? 0,
              };
            }

            if (acceptedByName.has(fname)) {
              const rec = acceptedByName.get(fname);
              const seeded = foldStage(it.stages, "vac_upload", 10, {
                filename: rec.filename,
              });
              return {
                ...it,
                status: "processing",
                jobId: jobId,
                progress: 10,
                stages: seeded,
              };
            }
            return {
              ...it,
              status: "idle",
              progress: 0,
            };
          })
        );

        if (jobId && accepted.length > 0) {
          if (streamsCleanupRef.current) {
            streamsCleanupRef.current();
            streamsCleanupRef.current = null;
          }

          const cleanup = openStreams(res.data, ({ jobId, type, payload }) => {
            const evType = payload?.last_event?.type || payload?.type || type;
            handleSseEvent(jobId, evType, payload);
          });

          streamsCleanupRef.current = cleanup;
        }
      } catch (err) {
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Erreur lors de l’upload.";

        setItems((prev) =>
          prev.map((it) => {
            if (it.status !== "uploading") return it;

            const isDup = /existe déjà|already exists|doublon|Vacataire déjà existant/i.test(
              String(detail)
            );
            const msg = isDup
              ? `Le CV « ${it.file?.name} » existe déjà (doublon).`
              : detail;

            const mergedStages = foldStage(it.stages, "vac_upload", 10, {
              error: msg,
            });

            scheduleErrorRemoval(it.id);
            clearFilePicker();

            return {
              ...it,
              status: "error",
              error: msg,
              httpStatus: err?.response?.status ?? 0,
              errorStage: "upload_or_read",
              stages: mergedStages,
              progress: percentFromStages(mergedStages) ?? 0,
            };
          })
        );
      } finally {
        setBusy(false);
      }
    },
    [
      items,
      uploadCVs,
      openStreams,
      handleSseEvent,
      clearFilePicker,
      scheduleErrorRemoval,
    ]
  );


  useEffect(() => {
    return () => {
      if (streamsCleanupRef.current) streamsCleanupRef.current();
      for (const t of cardTimersRef.current.values()) clearTimeout(t);
      cardTimersRef.current.clear();
    };
  }, []);

  const hasNonIdle = items.some((it) => it.status !== "idle");

  const {
    globalStages,
    globalJobState,
    globalErrorText,
    globalHttpStatus,
    globalErrorStage,
  } = useMemo(() => {
    const active = items.filter((it) => it.status !== "idle");
    if (!active.length) {
      return {
        globalStages: {},
        globalJobState: null,
        globalErrorText: undefined,
        globalHttpStatus: undefined,
        globalErrorStage: undefined,
      };
    }

    const err = active.find((it) => it.status === "error");
    const processing = active.find(
      (it) => it.status === "processing" || it.status === "uploading"
    );
    const ref = err || processing || active[0];

    return {
      globalStages: ref.stages || {},
      globalJobState: ref.status,
      globalErrorText: ref.error,
      globalHttpStatus: ref.httpStatus,
      globalErrorStage: ref.errorStage,
    };
  }, [items]);

  return (
    <div className={styles.page}>
      <div className={styles.left}>
        <div className={styles.leftScroll}>
          <div className={styles.headerContainer}>
            <button
              className={styles.backButton}
              onClick={() => window.history.back()}
            >
              ← {t("back", "Changer de type")}
            </button>
            <h1 className={styles.title}>
              {t("manage_external_data", "Gérer les données externes")}
            </h1>
          </div>
        </div></div>

      <section className={styles.centerWrap}>
        <article className={styles.card + " " + styles.appear}>
          <div className={styles.choiceIcon}>
            <PiReadCvLogo />
          </div>
          <div className={styles.choiceBody}>
            <h3 className={styles.choiceTitle}>
              {t("ut_upload_external_doc", "Téléverser des CV")}
            </h3>
            <p className={styles.choiceDesc}>
              {t(
                "cv_format_helper",
                "Chaque CV sera automatiquement formaté en sections : coordonnées, formations, expériences, hobbies…"
              )}
            </p>
          </div>
          <span className={styles.choiceBadge}>
            {t("format_files", "PDF / DOCX / DOC")}
          </span>

          <label
            className={styles.picker}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "copy";
            }}
            onDrop={onDrop}
            tabIndex={0}
            aria-label={t("upload_title_plural", "Dépose tes fichiers ici")}
          >
            <div className={styles.pickLeft} aria-hidden>
              📄
            </div>
            <div className={styles.pickTexts}>
              <div className={styles.pickTitle}>
                {t("upload_title_plural", "Dépose tes fichiers ici")}
              </div>
              <div className={styles.pickHint}>
                {t(
                  "upload_meta_file",
                  "Taille max 20 Mo / fichier • PDF / DOCX / DOC"
                )}
              </div>
            </div>
            <input
              ref={inputRef}
              className={styles.fileInput}
              type="file"
              multiple
              accept={acceptAttr}
              onChange={onInputChange}
            />
          </label>

          <div className={styles.list}>
            {items.length === 0 ? (
              <div className={styles.fileMuted}>
                {t(
                  "no_docs_yet",
                  "Aucun document sélectionné pour l’instant."
                )}
              </div>
            ) : (
              items.map(({ id, file, status, error }) => {
                const Icon =
                  ACCEPTED.find((a) =>
                    file.name?.toLowerCase().endsWith(a.ext)
                  )?.Icon || AiOutlineFilePdf;

                return (
                  <div key={id} className={styles.fileRowModern}>
                    <div className={styles.fileThumb} aria-hidden>
                      <Icon className={styles.fileThumbIcon} />
                    </div>

                    <div className={styles.fileInfo}>
                      <div className={styles.fileName} title={file.name}>
                        {file.name}

                      </div>
                      <div className={styles.fileSize}>
                        {(file.size / 1024).toFixed(2)} KB
                      </div>
                      {status === "error" && (
                        <div className={styles.fileErrorBadge}>
                          {error ||
                            t("upload_error_generic", "Erreur lors de l’import.")
                          }
                        </div>
                      )}
                    </div>

                    <div className={styles.fileActions}>
                      {status === "idle" && (
                        <button
                          className={styles.fileActionBtn}
                          onClick={() => removeOne(id)}
                          title={t(
                            "remove_file",
                            "Retirer le fichier"
                          )}
                          aria-label={t(
                            "remove_file",
                            "Retirer le fichier"
                          )}
                        >
                          <MdClose />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <footer className={styles.actions}>
            <button
              className={styles.primaryBtn}
              type="button"
              onClick={onUpload}
              disabled={busy || items.every((it) => it.status !== "idle")}
            >
              {busy ? t("uploading", "Import…") : t("send", "Envoyer")}
            </button>
          </footer>
        </article>

        {hasNonIdle && (
          <div className={styles.filesStepsWrap}>
            <div className={styles.fileSteps}>
              <ProcessSteps
                variant="external"
                stages={mapVacStages(globalStages)}
                jobState={globalJobState}
                errorText={globalErrorText}
                httpStatus={globalHttpStatus}
                errorStage={globalErrorStage}
                hidePercents={true}
              />
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
