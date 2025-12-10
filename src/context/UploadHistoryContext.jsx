import React, {
  createContext, useCallback, useContext, useEffect,
  useMemo, useRef, useState
} from "react";
import { useAppContext } from "../context/AppContext";
import { getUploadHistory, deleteHistoryAndRefresh } from "../features/jobFeatures";

const UploadHistoryContext = createContext(null);

export const UploadHistoryProvider = ({ children }) => {
  const { user } = useAppContext();

  const [history, setHistory] = useState([]);
  const [vacataires, setVacataires] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const inFlightRef = useRef(false);
  const loadedForEmailRef = useRef(null);

  const _fetch = useCallback(async (force = false) => {
    if (!user?.email) {
      setHistory([]);
      setVacataires([]);
      setError("");
      loadedForEmailRef.current = null;
      return;
    }

    if (!force && loadedForEmailRef.current === user.email) return;
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    setLoading(true);
    setError("");

    try {
      const { history, vacataires } = await getUploadHistory(user.email);
      setHistory(Array.isArray(history) ? history : []);
      setVacataires(Array.isArray(vacataires) ? vacataires : []);
      loadedForEmailRef.current = user.email;
    } catch (e) {
      setError("Erreur lors du chargement de l'historique.");
      setHistory([]);
      setVacataires([]);
    } finally {
      setLoading(false);
      inFlightRef.current = false;
    }
  }, [user?.email]);

  useEffect(() => {
    if (!user?.email) {
      setHistory([]);
      setVacataires([]);
      setError("");
      loadedForEmailRef.current = null;
      return;
    }
    _fetch(false);
  }, [user?.email, _fetch]);

  const refresh = useCallback(() => _fetch(true), [_fetch]);

  const last = useMemo(() => {
    if (!history || history.length === 0) return null;

    const sorted = [...history].sort((a, b) => {
      const da = new Date(a.date || a.created_at || a.timestamp || 0);
      const db = new Date(b.date || b.created_at || b.timestamp || 0);
      return db - da;
    });

    return sorted[0];
  }, [history]);

  const counts = useMemo(() => {
    const c = { internal: 0, external: 0, all: 0 };
    for (const h of history) {
      const tag = (h?.source || h?.origin || h?.type || "")
        .toString()
        .toLowerCase();
      if (tag.includes("internal") || tag === "interne") c.internal += 1;
      else if (tag.includes("external") || tag === "externe") c.external += 1;
      c.all += 1;
    }
    return c;
  }, [history]);

  const vacataireIds = useMemo(() => vacataires.map((v) => v.id), [vacataires]);
  const vacatairesById = useMemo(() => {
    const m = new Map();
    for (const v of vacataires) m.set(v.id, v);
    return m;
  }, [vacataires]);

  const removeByDate = useCallback(
    async (dateIso) => {
      if (!user?.email || !dateIso) return;
      await deleteHistoryAndRefresh(user.email, dateIso);
      setHistory((prev) => prev.filter((h) => h.date !== dateIso));
    },
    [user?.email]
  );

  const value = useMemo(
    () => ({
      history,
      loading,
      error,
      refresh,
      last,
      counts,
      vacataires,
      vacataireIds,
      vacatairesById,
      removeByDate,
    }),
    [
      history,
      loading,
      error,
      refresh,
      last,
      counts,
      vacataires,
      vacataireIds,
      vacatairesById,
      removeByDate,
    ]
  );

  return (
    <UploadHistoryContext.Provider value={value}>
      {children}
    </UploadHistoryContext.Provider>
  );
};


export const useUploadHistory = () => {
  const ctx = useContext(UploadHistoryContext);
  if (!ctx) {
    throw new Error("useUploadHistory must be used within an UploadHistoryProvider");
  }
  return ctx;
};
