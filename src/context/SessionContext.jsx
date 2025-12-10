import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useMemo,
    useCallback,
} from "react";
import PropTypes from "prop-types";
import localforage from "localforage";

export const SessionContext = createContext(null);

const defaultSession = {
    docType: "idcard",
    uploadedFiles: [],
    uploadedFileInfos: [],
    uploadedFilesBase64: [],
    extractedData: null,
    selectedCards: [],
    detectedCountries: [],
    filterMode: "Manually",
    selectedCountry: "anywhere",
    searchTerm: "",
    showList: true,
    openFilePreviews: [],
};

function loadInitialSession(storageKey) {
    if (typeof window === "undefined") return defaultSession;

    try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return defaultSession;

        const parsed = JSON.parse(raw) || {};

        const safe = {
            ...defaultSession,
            ...parsed,
        };

        if (!Array.isArray(safe.detectedCountries)) safe.detectedCountries = [];
        if (!Array.isArray(safe.selectedCards)) safe.selectedCards = [];
        if (!Array.isArray(safe.openFilePreviews)) safe.openFilePreviews = [];
        if (!Array.isArray(safe.uploadedFileInfos)) safe.uploadedFileInfos = [];
        if (!Array.isArray(safe.uploadedFilesBase64)) safe.uploadedFilesBase64 = [];

        safe.uploadedFiles = [];

        return safe;
    } catch (e) {
        return defaultSession;
    }
}

export const SessionProvider = ({ serviceKey = "default", children }) => {
    const storageKey = `oraculum_session_${serviceKey}`;

    const [session, setSession] = useState(() => loadInitialSession(storageKey));

    useEffect(() => {
        let cancelled = false;

        async function hydrateFiles() {
            const refs = Array.isArray(session.uploadedFilesBase64)
                ? session.uploadedFilesBase64
                : [];

            if (refs.length === 0) {
                if (!cancelled && session.uploadedFiles.length !== 0) {
                    setSession((s) => ({ ...s, uploadedFiles: [] }));
                }
                return;
            }

            const files = [];
            for (const info of refs) {
                if (!info || !info.key) continue;
                try {
                    const file = await localforage.getItem(info.key);
                    if (file instanceof File) {
                        files.push(file);
                    }
                } catch (err) {
                }
            }

            if (!cancelled) {
                setSession((s) => ({ ...s, uploadedFiles: files }));
            }
        }

        hydrateFiles();

        return () => {
            cancelled = true;
        };
    }, [session.uploadedFilesBase64]);

    useEffect(() => {
        try {
            const {
                uploadedFiles,
                uploadedFileInfos,
                uploadedFilesBase64,
                ...rest
            } = session;

            const lightFileInfos = Array.isArray(uploadedFileInfos)
                ? uploadedFileInfos
                    .map((info) => {
                        if (!info) return null;
                        const { name, size, type, lastModified } = info;
                        return { name, size, type, lastModified };
                    })
                    .filter(Boolean)
                : [];

            const fileRefs = Array.isArray(uploadedFilesBase64)
                ? uploadedFilesBase64.map((ref) => {
                    if (!ref) return null;
                    const { name, size, type, lastModified, key } = ref;
                    return { name, size, type, lastModified, key };
                }).filter(Boolean)
                : [];

            const persistable = {
                ...rest,
                uploadedFileInfos: lightFileInfos,
                uploadedFilesBase64: fileRefs,
            };

            localStorage.setItem(storageKey, JSON.stringify(persistable));
        } catch (e) {
        }
    }, [session, storageKey]);


    const setDocType = useCallback((docType) => {
        setSession((s) => {
            if (s.docType === docType) return s;
            return { ...s, docType };
        });
    }, []);

    const setUploadedFiles = useCallback((uploadedFiles) => {
        setSession((s) => ({
            ...s,
            uploadedFiles,
        }));
    }, []);

    const setUploadedFileInfos = useCallback((infos) => {
        setSession((s) => ({
            ...s,
            uploadedFileInfos: Array.isArray(infos) ? infos : [],
        }));
    }, []);

    const setUploadedFilesBase64 = useCallback((infos) => {
        setSession((s) => ({
            ...s,
            uploadedFilesBase64: Array.isArray(infos) ? infos : [],
        }));
    }, []);

    const setExtractedData = useCallback((updater) => {
        setSession((s) => {
            const prev = s.extractedData ?? null;
            let next =
                typeof updater === "function"
                    ? updater(prev)
                    : updater;

            if (next != null) {
                try {
                    next = JSON.parse(JSON.stringify(next));
                } catch (e) {

                    return s;
                }
            }

            if (prev === next) return s;
            return {
                ...s,
                extractedData: next,
            };
        });
    }, []);

    const setSelectedCards = useCallback((updater) => {
        setSession((s) => {
            const prev = s.selectedCards || [];
            const next =
                typeof updater === "function" ? updater(prev) : updater;
            if (prev === next) return s;
            return {
                ...s,
                selectedCards: next,
            };
        });
    }, []);

    const setDetectedCountries = useCallback((updater) => {
        setSession((s) => {
            const prev = Array.isArray(s.detectedCountries)
                ? s.detectedCountries
                : [];

            let next =
                typeof updater === "function" ? updater(prev) : updater;

            if (!Array.isArray(next)) {
                next = [];
            }

            if (prev === next) return s;

            return {
                ...s,
                detectedCountries: next,
            };
        });
    }, []);


    const setFilterMode = useCallback((filterMode) => {
        setSession((s) => {
            if (s.filterMode === filterMode) return s;
            return { ...s, filterMode };
        });
    }, []);

    const setSelectedCountry = useCallback((selectedCountry) => {
        setSession((s) => {
            if (s.selectedCountry === selectedCountry) return s;
            return { ...s, selectedCountry };
        });
    }, []);

    const setSearchTerm = useCallback((searchTerm) => {
        setSession((s) => {
            if (s.searchTerm === searchTerm) return s;
            return { ...s, searchTerm };
        });
    }, []);

    const setShowList = useCallback((updater) => {
        setSession((s) => {
            const prev = !!s.showList;
            const next =
                typeof updater === "function" ? updater(prev) : updater;
            if (prev === next) return s;
            return {
                ...s,
                showList: next,
            };
        });
    }, []);
    const removeUploadedFileAt = useCallback((index) => {
        setSession((s) => {
            const infos = Array.isArray(s.uploadedFileInfos)
                ? s.uploadedFileInfos.filter((_, i) => i !== index)
                : [];

            const files = Array.isArray(s.uploadedFiles)
                ? s.uploadedFiles.filter((_, i) => i !== index)
                : [];

            const refs = Array.isArray(s.uploadedFilesBase64)
                ? s.uploadedFilesBase64.filter((_, i) => i !== index)
                : [];

            return {
                ...s,
                uploadedFileInfos: infos,
                uploadedFiles: files,
                uploadedFilesBase64: refs,
            };
        });
    }, []);

    const resetSession = useCallback(() => {
        setSession({ ...defaultSession, uploadedFiles: [] });
    }, []);

    const setOpenFilePreviews = useCallback((updater) => {
        setSession((s) => {
            const prev = s.openFilePreviews || [];
            const next =
                typeof updater === "function" ? updater(prev) : updater;
            if (prev === next) return s;
            return {
                ...s,
                openFilePreviews: next,
            };
        });
    }, []);

    const value = useMemo(
        () => ({
            ...session,
            setDocType,
            setUploadedFiles,
            setUploadedFileInfos,
            setUploadedFilesBase64,
            setExtractedData,
            setSelectedCards,
            setDetectedCountries,
            setFilterMode,
            setSelectedCountry,
            setSearchTerm,
            setShowList,
            resetSession,
            setOpenFilePreviews, removeUploadedFileAt,
        }),
        [
            session,
            setDocType,
            setUploadedFiles,
            setUploadedFileInfos,
            setUploadedFilesBase64,
            setExtractedData,
            setSelectedCards,
            setDetectedCountries,
            setFilterMode,
            setSelectedCountry,
            setSearchTerm,
            setShowList,
            resetSession,
            setOpenFilePreviews, removeUploadedFileAt,
        ]
    );

    return (
        <SessionContext.Provider value={value}>
            {children}
        </SessionContext.Provider>
    );
};

SessionProvider.propTypes = {
    serviceKey: PropTypes.string,
    children: PropTypes.node.isRequired,
};

export const useSession = () => {
    const ctx = useContext(SessionContext);
    if (!ctx) {
        throw new Error("useSession must be used within a SessionProvider");
    }
    return ctx;
};
