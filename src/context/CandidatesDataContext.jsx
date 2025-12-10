import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { fetchAllPeople, importEmployees, openJobStream, deletePerson } from "../features/employees";
import { useAppContext } from "../context/AppContext";

const CandidatesDataContext = createContext(null);


function normalizeStages(raw = {}) {
  const pickPct = (...paths) => {
    for (const p of paths) {
      const v = p.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), raw);
      if (v != null) return Number(v) || 0;
    }
    return 0;
  };

  const pickMeta = (...paths) => {
    for (const p of paths) {
      const v = p.split(".").reduce((acc, k) => (acc && acc[k] != null ? acc[k] : null), raw);
      if (v && typeof v === "object") return v.meta || null;
    }
    return null;
  };

  const importPct = pickPct(
    "import.percent",
    "reading.percent",
    "upload.percent",
    "vac_upload.percent",
    "parsing.percent"
  );
  const savePct = pickPct("save.percent") || importPct;
  const summariesPct = pickPct("summaries.percent", "vac_summaries.percent");
  const clusteringPct = pickPct(
    "clustering.percent",
    "vac_cluster.percent",
    "vac_clustering.percent",
    "cluster.percent"
  );

  return {
    import: { percent: clamp(importPct), meta: pickMeta("import", "reading", "upload", "vac_upload", "parsing") },
    save: { percent: clamp(savePct), meta: pickMeta("save") },
    summaries: { percent: clamp(summariesPct), meta: pickMeta("summaries", "vac_summaries") },
    clustering: { percent: clamp(clusteringPct), meta: pickMeta("clustering", "vac_cluster", "vac_clustering", "cluster") },
  };
}

function clamp(n) {
  const x = Number(n) || 0;
  if (x < 0) return 0;
  if (x > 100) return 100;
  return Math.round(x);
}

export function CandidatesDataProvider({ children }) {
  const [items, setItems] = useState({ internal: [], vacataires: [], offers: [], total_all: 0 });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAppContext();

  const [jobId, setJobId] = useState(null);
  const [jobState, setJobState] = useState(null);
  const [stages, setStages] = useState({});
  const [lastEvent, setLastEvent] = useState(null);
  const esCloseRef = useRef(null);

  const prevStagesRef = useRef({});
  const prevStateRef = useRef(null);
  const lastSeqRef = useRef(-1);

const refresh = useCallback(async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetchAllPeople(user?.email);

    const internal = Array.isArray(res?.professors)
      ? res.professors
      : Array.isArray(res?.internal)
        ? res.internal
        : Array.isArray(res?.items)
          ? res.items
          : Array.isArray(res)
            ? res
            : [];

    const vacataires = Array.isArray(res?.vacataires) ? res.vacataires : [];
    const offers = Array.isArray(res?.offers) ? res.offers : [];

    const total_all =
      typeof res?.total_all === "number"
        ? res.total_all
        : (Array.isArray(internal) ? internal.length : 0) +
          (Array.isArray(vacataires) ? vacataires.length : 0) +
          (Array.isArray(offers) ? offers.length : 0);

    const normalized = {
      internal,
      vacataires,
      offers,
      total_internal:
        typeof res?.total_professors === "number"
          ? res.total_professors
          : typeof res?.total_internal === "number"
            ? res.total_internal
            : internal.length,
      total_vacataires:
        typeof res?.total_vacataires === "number"
          ? res.total_vacataires
          : vacataires.length,
      total_offers:
        typeof res?.total_offers === "number"
          ? res.total_offers
          : offers.length,
      total_all,
    };

    setItems(normalized);
    setTotal(normalized.total_all);
  } catch (e) {
    setError(e?.message || "fetch_failed");
    setItems({ internal: [], vacataires: [], offers: [], total_all: 0 });
    setTotal(0);
  } finally {
    setLoading(false);
  }
}, [user?.email]);

  const logStageDiffs = useCallback((nextStages) => {
    const prev = prevStagesRef.current || {};
    const stageNames = ["import", "save", "summaries", "clustering"];

    stageNames.forEach((name) => {
      const prevPct = prev?.[name]?.percent ?? null;
      const nextPct = nextStages?.[name]?.percent ?? null;

    });

    prevStagesRef.current = nextStages || {};
  }, []);

  const closeStream = useCallback(() => {
    if (esCloseRef.current) {
      try { esCloseRef.current(); } catch { }
      esCloseRef.current = null;
    }
  }, []);

  const startWatchJob = useCallback(
  (jid) => {
    if (!jid) return;
    closeStream();
    setJobId(jid);
    setJobState("running");
    setStages({});
    setLastEvent(null);
    prevStagesRef.current = {};
    prevStateRef.current = "running";
    lastSeqRef.current = -1;

    esCloseRef.current = openJobStream(jid, (payload) => {
      if (!payload || typeof payload !== "object") return;

      const seq = Number(payload?.seq ?? payload?.last_event?.seq ?? NaN);
      if (!Number.isNaN(seq) && seq <= lastSeqRef.current) {
        return;
      }
      if (!Number.isNaN(seq)) lastSeqRef.current = seq;

      if (payload?.stages && typeof payload.stages === "object") {
        const norm = normalizeStages(payload.stages);
        logStageDiffs(norm);
        setStages(norm);
      }

      if (payload?.last_event) {
        setLastEvent(payload.last_event);
      }

      let nextState = payload?.state;
      if (!nextState && typeof payload?.success !== "undefined") {
        nextState =
          String(payload.success).toLowerCase() === "true" || payload.success === true
            ? "done"
            : "error";
      }

      if (nextState) {
        const prev = prevStateRef.current;
        if (prev !== nextState) {
          prevStateRef.current = nextState;
        }
        setJobState(nextState);
      }
      if (nextState === "done" || nextState === "error") {
        closeStream();
        if (nextState === "done") {
          refresh();
        } else {
        }
      }
    });
  },
  [closeStream, refresh, logStageDiffs]
);


const importAndRefresh = useCallback(
  async ({ prof, admin, ent, publication, iresearch, teaching }) => {
    setUpdating(true);
    setError(null);
    try {
      const payload = {
        professeurs: prof ?? null,
        administratifs: admin ?? null,
        entretiens: ent ?? null,

        publication: publication ?? null,
        iresearch: iresearch ?? null,
        teaching: teaching ?? null,
      };

      const { ok, data } = await importEmployees(payload);

      if (!ok) throw new Error(data?.detail || "import_failed");

      const jid = data?.job_id;
      if (jid) {
        startWatchJob(jid);
      } else {
        await refresh();
      }

      return { ok: true, jobId: jid };
    } catch (e) {
      setError(e?.message || "import_failed");
      return { ok: false, error: e };
    } finally {
      setUpdating(false);
    }
  },
  [refresh, startWatchJob]
);



  const deleteAndRefresh = useCallback(
    async (options = {}) => {
      setUpdating(true);
      setError(null);
      try {
        const data = await deletePerson(options); 

        await refresh();

        return { ok: true, data };
      } catch (e) {
        setError(e?.message || "delete_failed");
        return { ok: false, error: e };
      } finally {
        setUpdating(false);
      }
    },
    [refresh]
  );


  useEffect(() => {
    return () => {
      closeStream();
    };
  }, [closeStream]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = {
    items,
    total,
    loading,
    updating,
    error,

    refresh,
    importAndRefresh,
    deleteAndRefresh,

    jobId,
    jobState,
    stages,
    lastEvent,
  };

  return (
    <CandidatesDataContext.Provider value={value}>
      {children}
    </CandidatesDataContext.Provider>
  );
}

export function useCandidatesData() {
  const ctx = useContext(CandidatesDataContext);
  if (!ctx) throw new Error("useCandidatesData must be used within CandidatesDataProvider");
  return ctx;
}
