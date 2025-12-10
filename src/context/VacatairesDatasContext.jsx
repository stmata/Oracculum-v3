import React, {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  uploadVacataires,
  normalizeUploadResult,
  openJobStream,
  watchUpload,
} from "../features/vacataires";


const VacatairesDataCtx = createContext(null);

export function VacatairesDatasProvider({ children }) {
  const [isUploading, setIsUploading] = useState(false);
  const [lastUploadResp, setLastUploadResp] = useState(null);
  const [lastJobId, setLastJobId] = useState(null);
  const [lastSsePayload, setLastSsePayload] = useState(null);

  const abortRef = useRef(null);
  const sseStopsRef = useRef(new Map());

  const cancelUpload = useCallback(() => {
    if (abortRef.current) {
      try {
        abortRef.current.abort();
      } catch { }
      abortRef.current = null;
    }
  }, []);

  const closeStream = useCallback((jobId) => {
    const stop = sseStopsRef.current.get(jobId);
    if (typeof stop === "function") {
      try {
        stop();
      } catch { }
      sseStopsRef.current.delete(jobId);
    }
  }, []);

  const closeAllStreams = useCallback(() => {
    for (const stop of sseStopsRef.current.values()) {
      try {
        stop?.();
      } catch { }
    }
    sseStopsRef.current.clear();
  }, []);

  const uploadCVs = useCallback(
    async (
      files,
      { uploaderEmail, reclusterAfter = true, sourceLabel = "Vacataires" } = {}
    ) => {
      if (!files?.length) return { ok: false, status: 400, error: "No files" };

      cancelUpload();
      closeAllStreams();

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsUploading(true);

      try {
        const res = await uploadVacataires(files, {
          signal: ctrl.signal,
          uploaderEmail,
          reclusterAfter,
          sourceLabel,
        });

        setLastUploadResp(res);

        if (res?.ok && res.data?.job_id) {
          const jobId = res.data.job_id;
          setLastJobId(jobId);
          const stop = openJobStream(jobId, (payload) => {
            setLastSsePayload(payload);
          });
          sseStopsRef.current.set(jobId, stop);
        }

        return res ?? { ok: false, status: 0, error: "Empty response" };
      } catch (err) {
        const msg = err?.message || "Upload failed";
        const errorRes = { ok: false, status: err?.status ?? 0, error: msg };
        setLastUploadResp(errorRes);
        return errorRes;
      } finally {
        setIsUploading(false);
        abortRef.current = null;
      }
    },
    [cancelUpload, closeAllStreams]
  );

  const uploadAndWatch = useCallback(
    async (
      files,
      {
        uploaderEmail,
        reclusterAfter = true,
        sourceLabel = "Vacataires",
        onUpdate,
        onError,
      } = {}
    ) => {
      closeAllStreams();
      cancelUpload();

      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setIsUploading(true);

      try {
        const { jobId, close, upload } = await watchUpload(files, {
          signal: ctrl.signal,
          uploaderEmail,
          reclusterAfter,
          sourceLabel,
          onUpdate: (payload) => {
            const evType = payload?.last_event?.type || payload?.type || "update";
            setLastSsePayload(payload);
            if (jobId) setLastJobId(jobId);
            try {
              onUpdate?.({ type: evType, payload });
            } catch { }
          },
          onError,
        });

        if (upload) {
          setLastUploadResp(upload.raw || upload);
        }

        if (jobId) sseStopsRef.current.set(jobId, close);
        return { jobId, close, upload };
      } finally {
        setIsUploading(false);
        abortRef.current = null;
      }
    },
    [cancelUpload, closeAllStreams]
  );

  const openStreamFromUploadResp = useCallback(
    (resp, onUpdate) => {
      const { jobId } = normalizeUploadResult(resp);
      if (!jobId) return () => { };
      if (sseStopsRef.current.has(jobId)) return () => closeStream(jobId);

      const stop = openJobStream(jobId, (payload) => {
        const evType = payload?.last_event?.type || payload?.type || "update";
        setLastSsePayload(payload);
        setLastJobId(jobId);
        try {
          onUpdate?.({ type: evType, payload });
        } catch { }
      });
      sseStopsRef.current.set(jobId, stop);
      return () => closeStream(jobId);
    },
    [closeStream]
  );

  const openStreams = useCallback(
    (apiDataOrJobId, onEvent) => {
      closeAllStreams();

      const jobIds = [];

      if (typeof apiDataOrJobId === "string") {
        jobIds.push({ job_id: apiDataOrJobId, filename: undefined });
      } else if (apiDataOrJobId && typeof apiDataOrJobId === "object") {
        if (apiDataOrJobId.job_id) {
          jobIds.push({
            job_id: apiDataOrJobId.job_id,
            filename: apiDataOrJobId.filename,
          });
        } else if (apiDataOrJobId.jobId) {
          jobIds.push({
            job_id: apiDataOrJobId.jobId,
            filename: apiDataOrJobId.filename,
          });
        } else if (Array.isArray(apiDataOrJobId.results)) {
          for (const r of apiDataOrJobId.results) {
            if (r?.job_id)
              jobIds.push({ job_id: r.job_id, filename: r.filename });
          }
        } else if (apiDataOrJobId.data?.job_id) {
          jobIds.push({
            job_id: apiDataOrJobId.data.job_id,
            filename: undefined,
          });
        }
      }

      if (!jobIds.length) return () => { };

      for (const { job_id, filename } of jobIds) {
        if (!job_id || sseStopsRef.current.has(job_id)) continue;

        const stop = openJobStream(job_id, (payload) => {
          const evType = payload?.last_event?.type || payload?.type || "update";
          setLastSsePayload(payload);
          setLastJobId(job_id);
          try {
            onEvent?.({
              jobId: job_id,
              filename,
              type: evType,
              payload,
            });
          } catch { }
        });

        sseStopsRef.current.set(job_id, stop);
      }

      return closeAllStreams;
    },
    [closeAllStreams]
  );

  useEffect(() => {
    return () => {
      closeAllStreams();
      if (abortRef.current) {
        try {
          abortRef.current.abort();
        } catch { }
        abortRef.current = null;
      }
    };
  }, [closeAllStreams]);

  const value = useMemo(
    () => ({
      isUploading,
      lastUploadResp,
      lastJobId,
      lastSsePayload,
      uploadCVs,
      uploadAndWatch,
      openStreamFromUploadResp,
      openStreams,
      cancelUpload,
      closeStream,
      closeAllStreams,
    }),
    [
      isUploading,
      lastUploadResp,
      lastJobId,
      lastSsePayload,
      uploadCVs,
      uploadAndWatch,
      openStreamFromUploadResp,
      openStreams,
      cancelUpload,
      closeStream,
      closeAllStreams,
    ]
  );

  return (
    <VacatairesDataCtx.Provider value={value}>
      {children}
    </VacatairesDataCtx.Provider>
  );
}

export function useVacatairesData() {
  const ctx = useContext(VacatairesDataCtx);
  if (!ctx)
    throw new Error(
      "useVacatairesData must be used within VacatairesDatasProvider"
    );
  return ctx;
}
