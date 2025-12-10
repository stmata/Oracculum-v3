const BASE_URL = window._env_?.VITE_APP_BASE_URL;
const BASE_URL2 = window._env_?.VITE_APP_BASE_URL2;
// const BASE_URL2 = (window._env_?.VITE_APP_BAS_URL2 || import.meta.env.VITE_APP_BASE_URL2).replace(/\/$/, "");
// const BASE_URL = (window._env_?.VITE_APP_BAS_URL || import.meta.env.VITE_APP_BASE_URL).replace(/\/$/, "");

export const postFormData = async (endpoint, formData) => {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method: "POST",
    body: formData,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to fetch from API: ${res.status} ${text}`);
  }
  return res.json();
};


export const postJSON = async (endpoint, jsonBody, format) => {
  const res = await fetch(`${BASE_URL}${endpoint}?format=${format}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonBody),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Export failed: ${res.status} ${text}`);
  }
  return res;
};

export const sendVerificationEmail = async (email) => {
  const response = await fetch(`${BASE_URL2}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.detail || "Erreur lors de l’envoi du code.");
    error.status = response.status;
    throw error;
  }

  return data;
};


export const sendVerificationCodeAPI = async (email) => {
  const response = await fetch(`${BASE_URL2}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await response.json();

  if (!response.ok) {
    const error = new Error(data.detail || "Erreur lors de l’envoi du code.");
    error.status = response.status;
    throw error;
  }

  return data;
};

export const verifyCodeAPI = async (email, code) => {
  const response = await fetch(`${BASE_URL2}/verify_code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.detail || "Code incorrect.");
  }

  return await response.json();
};

export const fetchUserUploadHistoryAPI = async (email) => {
  const url = `${BASE_URL2}/history?email=${encodeURIComponent(email)}`;
  const response = await fetch(url);

  if (response.status === 404) {
    return { history: [], vacataires: [] };
  }

  if (!response.ok) {
    const error = new Error("Erreur lors de la récupération de l'historique.");
    error.status = response.status;
    throw error;
  }

  const data = await response.json();

  const history = Array.isArray(data.upload_history) ? data.upload_history : [];

  const raw = Array.isArray(data.vacataires) ? data.vacataires : [];
  const vacataires = raw
    .map((v) => ({
      id: String(v.id ?? v._id ?? ""),
      filename: v.filename ?? v.cv?.filename ?? null,
    }))
    .filter((v) => v.id);

  return { history, vacataires };
};

export const deleteUserHistoryByDateAPI = async (email, date) => {
  if (!email) throw new Error("email est requis.");
  if (!date) throw new Error("date est requise.");

  const params = new URLSearchParams({ email, date });

  const response = await fetch(
    `${BASE_URL2}/history/entry?${params.toString()}`,
    { method: "DELETE" }
  );

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(data.detail || "Erreur lors de la suppression.");
    error.status = response.status;
    throw error;
  }

  return data;
};

function _stageDeltaLogs(prevStages, nextStages) {
  const logs = [];
  const names = new Set([...Object.keys(prevStages || {}), ...Object.keys(nextStages || {})]);
  for (const name of names) {
    const prev = prevStages?.[name] || {};
    const cur = nextStages?.[name] || {};
    const pPrev = Number(prev?.percent ?? -1);
    const pCur = Number(cur?.percent ?? -1);
    if (pCur !== pPrev || JSON.stringify(prev?.meta || {}) !== JSON.stringify(cur?.meta || {})) {
      logs.push({ name, percent: pCur, meta: cur?.meta || {} });
    }
  }
  return logs;
}

export async function uploadAnalysisAPI(
  file,
  email,
  {
    candidateSource = "internal",
    department = "All",
    saveResults = true,
    externalCVs = [],
    offerMode = "new",
    stream = true,
  } = {},
  { onUpdate, onResult, onError } = {}
) {
  const formData = new FormData();
  formData.append("email", email);
  formData.append("candidate_source", candidateSource);
  formData.append("department", department);
  formData.append("save_results", String(!!saveResults));
  formData.append("stream_mode", String(!!stream));
  (externalCVs || []).forEach((cv) => formData.append("cvs", cv));

  if (file?.isExistingOffer) {
    formData.append("job_filename", file.name);
    formData.append("offer_mode", "existing");
  } else if (file instanceof File) {
    formData.append("job_file", file);
    formData.append("offer_mode", offerMode || "new");
  } else {
    throw new Error("Fichier invalide ou manquant pour l'analyse.");
  }

  const resp = await fetch(`${BASE_URL2}/match_candidates`, { method: "POST", body: formData });
  let data;
  try { data = await resp.json(); } catch { throw new Error("Réponse JSON invalide du serveur."); }
  if (!resp.ok) {
    const err = new Error(data?.detail || "Erreur pendant l'analyse.");
    err.status = resp.status;
    throw err;
  }

  if (!stream || !data?.job_id) {
    const r = data || {};

    try { onResult?.(r); } catch { }
    return r;
  }

  const jobId = data.job_id;
  const url = `${BASE_URL2}/jobs/${encodeURIComponent(jobId)}/stream`;

  return new Promise((resolve, reject) => {
    const es = new EventSource(url);
    let lastSeq = -1;
    let gotDone = false;
    let gotResult = false;
    let fullResult = null;
    let closed = false;
    let stages = {};

    const cleanup = () => { if (!closed) { closed = true; try { es.close(); } catch { } } };
    const maybeFinish = () => {
      if (gotDone && gotResult) {
        cleanup();
        return resolve(fullResult);
      }
    };

    es.addEventListener("keepalive", (ev) => {
    });

    es.addEventListener("update", (ev) => {
      try {
        const p = JSON.parse(ev.data);
        const seq = Number(p?.seq ?? -1);
        if (!Number.isNaN(seq) && seq <= lastSeq) return;
        lastSeq = seq;

        const state = String(p?.state || "").toLowerCase();
        const snapshotStages = p?.stages || {};

        const deltas = _stageDeltaLogs(stages, snapshotStages);
        stages = { ...snapshotStages };

        const le = p?.last_event || {};
        if (le?.type === "result" && le?.payload) {
          fullResult = le.payload;
          gotResult = true;


          try { onResult?.(fullResult); } catch { }
        }

        try { onUpdate?.({ ...p, stages }); } catch { }

        if (state === "error") {
          cleanup();
          const err = new Error(p?.error || "Erreur pendant le matching.");
          try { onError?.(err); } catch { }
          return reject(err);
        }
        if (state === "done") {
          gotDone = true;
          maybeFinish();
        }
      } catch (e) {
      }
    });

    es.addEventListener("error", (ev) => {
      cleanup();
      try { onError?.(ev); } catch { }
      reject(new Error("Flux SSE interrompu avant résultat final."));
    });
  });
}

export function openJobStream(jobId, { onUpdate, onResult, onError } = {}) {
  if (!jobId) return () => { };
  const url = `${BASE_URL2}/jobs/${encodeURIComponent(jobId)}/stream`;
  const es = new EventSource(url);

  let lastSeq = -1;
  let stages = {};
  let gotDone = false;
  let gotResult = false;
  let fullResult = null;
  let closed = false;

  const cleanup = () => { if (!closed) { closed = true; try { es.close(); } catch { } } };
  const maybeFinish = () => { if (gotDone && gotResult) cleanup(); };

  es.addEventListener("keepalive", () => { });

  es.addEventListener("update", (ev) => {
    try {
      const p = JSON.parse(ev.data);
      const seq = Number(p?.seq ?? -1);
      if (!Number.isNaN(seq) && seq <= lastSeq) return;
      lastSeq = seq;

      const snapshotStages = p?.stages || {};
      const deltas = _stageDeltaLogs(stages, snapshotStages);
      stages = { ...snapshotStages };

      const le = p?.last_event || {};
      if (le?.type === "result" && le?.payload) {
        fullResult = le.payload;
        gotResult = true;


        try { onResult?.(fullResult); } catch { }
      }

      try { onUpdate?.({ ...p, stages }); } catch { }

      const st = String(p?.state || "").toLowerCase();
      if (st === "error") {
        const err = new Error(p?.error || "Unknown error");
        try { onError?.(err); } catch { }
        return cleanup();
      }
      if (st === "done") {
        gotDone = true;
        maybeFinish();
      }
    } catch (e) {
    }
  });

  es.addEventListener("error", (ev) => {
    try { onError?.(ev); } catch { }
    cleanup();
  });

  return () => cleanup();
}
