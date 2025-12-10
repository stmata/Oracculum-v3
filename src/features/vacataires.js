// const BASE_URL = import.meta.env.VITE_APP_BASE_URL2;
const BASE_URL =
  (window._env_ && window._env_.VITE_APP_BAS_URL2) ||   
  import.meta.env.VITE_APP_BAS_URL2

function safeJsonParse(t) { try { return JSON.parse(t); } catch { return null; } }
const toBool = (x) => !!x;

const ERROR_EVENTS = new Set([
  "vac_duplicate_pdf",
  "vac_parse_giveup",
  "vac_duplicate_collab",
  "vac_file_error",
  "vac_pipeline_error",
  "vac_ingest_error",
]);

const seenMilestonesByJob = new Map();  
const lastErrorByJob = new Map();       

function tagOf(jobId) { return jobId.slice(0, 8); }
function mark(jobId, key, printer) {
  const set = seenMilestonesByJob.get(jobId) || new Set();
  if (set.has(key)) return false;
  set.add(key);
  seenMilestonesByJob.set(jobId, set);
  printer?.();
  return true;
}

export async function uploadVacataires(
  files,
  { signal, uploaderEmail, reclusterAfter = true, sourceLabel = "Vacataires" } = {}
) {
  if (!files?.length) return { ok: false, status: 400, data: null, error: "Aucun fichier" };

  const fd = new FormData();
  for (const f of files) fd.append("files", f);

  const qs = new URLSearchParams();
  if (uploaderEmail) qs.set("uploader_email", uploaderEmail);
  qs.set("recluster_after", String(!!reclusterAfter));
  qs.set("source_label", sourceLabel);

  let resp;
  try { resp = await fetch(`${BASE_URL}/vacataires/upload?${qs.toString()}`, { method: "POST", body: fd, signal }); }
  catch (e) { return { ok: false, status: 0, data: null, error: String(e?.message || e) }; }

  let raw = ""; try { raw = await resp.text(); } catch { }
  const data = raw ? safeJsonParse(raw) : null;
  const okish = resp.ok || resp.status === 202;

  return {
    ok: okish,
    status: resp.status,
    data,
    error: okish ? null : (data?.detail || data?.message || "Upload failed"),
  };
}

export function normalizeUploadResult(uploadResp) {
  const d = uploadResp?.data || {};
  const jobId = d?.job_id || null;

  const accepted = Array.isArray(d?.accepted) ? d.accepted : [];
  const rejected = Array.isArray(d?.rejected) ? d.rejected : [];
  const duplicates = Array.isArray(d?.duplicates) ? d.duplicates : [];

  return {
    jobId,
    filesAccepted: accepted.map((x) => x?.filename).filter(toBool),
    filesRejected: rejected,
    filesDuplicates: duplicates.map((x) => x?.filename).filter(toBool),
    duplicates,
    total: Number(d?.total ?? (accepted.length + rejected.length + duplicates.length)) || 0,
    raw: uploadResp,
  };
}


function logMilestones(jobId, payload) {
  const tag = tagOf(jobId);
  const state = String(payload?.state || "").toLowerCase();
  const type = payload?.last_event?.type;
  const file = payload?.last_event?.filename || payload?.stages?.vac_upload?.meta?.file || "";
  const s = payload?.stages || {};

  if (ERROR_EVENTS.has(type)) {
    const extra = payload?.last_event?.error || payload?.last_event?.collab_key || "";
    const msg = `${type}${file ? ` | file: ${file}` : ""}${extra ? ` | ${extra}` : ""}`;
    lastErrorByJob.set(jobId, msg);
  }

  if (state === "error") {
    const globalMsg = payload?.error;
    const cached = lastErrorByJob.get(jobId);
    const lastEvent = payload?.last_event?.type;
    const err = payload?.last_event?.error;
    const finalMsg =
      (globalMsg && globalMsg !== "one or more files failed") ? globalMsg :
        cached || err || `last=${lastEvent || "?"}`;
    return;
  }
}
function deriveError(jobId, payload) {
  const state = String(payload?.state || "").toLowerCase();
  const lastType = payload?.last_event?.type;
  const globalMsg = payload?.error;
  const cached = lastErrorByJob.get(jobId);
  const err = payload?.last_event?.error;
  if (state === "error") {
    return (globalMsg && globalMsg !== "one or more files failed")
      ? globalMsg
      : (cached || err || `last=${lastType || "?"}`);
  }
  if (ERROR_EVENTS.has(lastType)) {
    const file = payload?.last_event?.filename || payload?.stages?.vac_upload?.meta?.file || "";
    const extra = payload?.last_event?.error || payload?.last_event?.collab_key || "";
    return `${lastType}${file ? ` | file: ${file}` : ""}${extra ? ` | ${extra}` : ""}`;
  }
  return null;
}

export function makeStepsFromPayload(payload) {
  const s = payload?.stages || {};
  const lastType = payload?.last_event?.type;
  const state = String(payload?.state || "").toLowerCase();

  const parseStarted = ["vac_parse_start", "vac_parsed"].includes(lastType) || (s.vac_upload?.percent ?? 0) >= 15;
  const parseDone = lastType === "vac_parsed";

  const llmStarted = ["vac_llm_start", "vac_llm_extracted"].includes(lastType) || (s.vac_summaries?.percent ?? 0) >= 50;
  const llmDone = lastType === "vac_llm_extracted";

  const embStarted = ["vac_embedding_start", "vac_assign_start", "vac_embed_debug"].includes(lastType) || (s.vac_summaries?.percent ?? 0) >= 70;
  const embDone = lastType === "vac_assign_done";

  const clusterPct = s.vac_cluster?.percent ?? 0;
  const clusterStarted = ["vac_cluster_start", "vac_cluster_progress"].includes(lastType) || clusterPct > 0;
  const clusterDone = ["vac_cluster_done"].includes(lastType) || clusterPct >= 100;

  const pipelinePct = Math.max(s.vac_pipeline?.percent ?? 0, s.vac_upload?.percent ?? 0);

  const step = (key, label, started, done, percent = 0) => ({
    key, label,
    status: done ? "done" : started ? "active" : "idle",
    percent: done ? 100 : started ? Math.max(5, Math.min(95, percent)) : 0,
  });

  return [
    step("parse", "Parsing", parseStarted, llmStarted || parseDone, parseStarted ? 50 : 0),
    step("llm", "LLM Extract", llmStarted, embStarted || llmDone, llmStarted ? 50 : 0),
    step("embedding", "Embedding", embStarted, embDone, embStarted ? 60 : 0),
    step("cluster", "Clustering", clusterStarted, clusterDone, clusterPct || (clusterStarted ? 10 : 0)),
    {
      key: "pipeline",
      label: "Pipeline",
      status: state === "done" ? "done" : state === "error" ? "error" : "active",
      percent: state === "done" ? 100 : pipelinePct,
    },
  ];
}

export const LABELS = {
  created: "Job créé",
  vac_batch_start: "Batch démarré",
  vac_batch_buffered: "Fichiers bufferisés",
  vac_file_start: "Traitement fichier",
  vac_file_done: "Fichier terminé",
  vac_file_error: "Erreur fichier",
  vac_upload_start: "Lecture du fichier",
  vac_parse_start: "Début parsing",
  vac_parsed: "Parsing terminé",
  vac_parse_giveup: "Échec parsing",
  vac_llm_start: "Extraction LLM",
  vac_llm_extracted: "JSON extrait",
  vac_embedding_start: "Embedding",
  vac_embed_debug: "Debug embedding",
  vac_assign_start: "Assignation au cluster",
  vac_assign_done: "Assignation terminée",
  vac_cluster_start: "Reclustering global",
  vac_cluster_done: "Reclustering terminé",
  vac_pipeline_start: "Pipeline démarré",
  vac_pipeline_done: "Pipeline terminé",
  vac_pipeline_error: "Erreur pipeline",
  vac_ingest_error: "Erreur ingestion",
  vac_batch_done: "Batch terminé",
  vac_duplicates_detected: "Doublons détectés",
  done: "Terminé",
};

export function openJobStream(jobId, onUpdate) {
  if (!jobId) return () => { };
  const url = `${BASE_URL}/jobs/${encodeURIComponent(jobId)}/stream`;

  let lastSeq = -1;
  const es = new EventSource(url);

  es.addEventListener("update", (ev) => {
    const payload = safeJsonParse(ev.data);
    if (!payload) return;

    const seq = Number(payload?.seq ?? -1);
    if (!Number.isNaN(seq) && seq <= lastSeq) return;
    lastSeq = seq;

    logMilestones(jobId, payload);
try { onUpdate?.(payload, makeStepsFromPayload(payload)); } catch {}
const errMsg = deriveError(jobId, payload);
   if (errMsg) {
     try { onUpdate?.({ ...payload, type: "error", message: errMsg }, makeStepsFromPayload(payload)); } catch {}
  }
    const st = String(payload?.state || "").toLowerCase();
    if (["done", "error", "gone"].includes(st)) {
      es.close();
    }
  });

  es.addEventListener("keepalive", (ev) => { });
es.addEventListener("final", (ev) => { es.close(); }); 
es.addEventListener("error", (ev) => {
   try { onUpdate?.({ type: "sse_error", message: "Connexion SSE interrompue" }); } catch {}
});
  return () => { try { es.close(); } catch { };  };
}

export async function watchUpload(files, {
  signal,
  uploaderEmail,
  reclusterAfter = true,
  sourceLabel = "Vacataires",
  onUpdate,
  onError,
} = {}) {
  const resp = await uploadVacataires(files, { signal, uploaderEmail, reclusterAfter, sourceLabel });

  if (!resp.ok) {
    const err = resp?.error || "Upload failed";
    try { onError?.(err, resp); } catch { }
    return { jobId: null, close: () => { }, upload: null };
  }

  const norm = normalizeUploadResult(resp);
  const { jobId, duplicates } = norm;

  if (Array.isArray(duplicates) && duplicates.length > 0) {
    try {
      onUpdate?.(
        {
          type: "vac_duplicates_detected",
          items: duplicates,
        }
      );
    } catch { }
  }

  if (!jobId) {
    const err = "Aucun job_id retourné par le backend";
    try { onError?.(err, resp); } catch { }
    return { jobId: null, close: () => { }, upload: norm };
  }

  const close = openJobStream(jobId, onUpdate);
  return { jobId, close, upload: norm };
}



