import React, { useMemo, useState } from "react";
import styles from "./CandidatesListPage.module.css";
import { useCandidatesData } from "../../../../../../../../context/CandidatesDataContext";
import { LuEye, LuHistory, LuTrash2, LuSettings } from "react-icons/lu";
import { FiUsers, FiX } from "react-icons/fi";
import Modal from "../../../../Modal/Modal";
import TopStats from "./TopStats/TopStats";
import PillSelect from "../../../../utils/PillSelect/PillSelect";
import SidePane from "./SidePane/SidePane";
import { useTranslation } from "../../../../../../../../utils/useTranslation";
import { MdManageSearch } from "react-icons/md";
import { LuBookOpen } from "react-icons/lu";

export default function CandidatesListPage() {
    const { items, loading, error, deleteAndRefresh, updating } = useCandidatesData();
    const { t } = useTranslation();
    const [position, setPosition] = useState("EAP_Professeurs");
    const [personType, setPersonType] = useState("all");
    const [selected, setSelected] = useState(null);
    const [mode, setMode] = useState(null);
    const [toDelete, setToDelete] = useState(null);
    const isOpen = !!selected;
    const [q, setQ] = useState("");
    const onClearFilters = () => {
        setQ("");
        setPosition("EAP_Professeurs");
        setPersonType("all");
    };
    const TYPE_OPTIONS = useMemo(
        () => [
            { value: "all", label: t("filters_all", "Tous") },
            { value: "interne", label: t("filters_internal", "Internes (professeurs)") },
            { value: "externe", label: t("filters_external", "Vacataires") },
        ],
        [t]
    );
    const normalizedItems = useMemo(() => {
        const raw = items || {};
        if (Array.isArray(raw)) return raw;

        const internal = Array.isArray(raw.internal) ? raw.internal : [];
        const vacataires = Array.isArray(raw.vacataires) ? raw.vacataires : [];

        const tagInterne = (it) => {
            const baseSources = Array.isArray(it?.sources)
                ? it.sources
                : (it?.source && [it.source]) ||
                (it?.department && [it.department]) ||
                [];

            const normalizedSources =
                baseSources.length > 0 ? baseSources : ["EAP_Professeurs"];

            return {
                ...it,
                _source: "interne",
                external: false,
                sources: normalizedSources,
            };
        };
        const tagExterne = (it) => {
            const parsed = it?.parsed || null;
            const identity = parsed?.identity || {};
            const summaryFromParsed = {
                identity: {
                    name:
                        identity?.full_name ||
                        it?.collab_key ||
                        it?.full_name ||
                        it?.name ||
                        "",
                    current_role:
                        identity?.current_title?.raw ||
                        identity?.current_title?.normalized ||
                        "",
                    qualification: identity?.seniority || "",
                },
                summary_long: parsed?.summary_long || "",
                signals: {
                    expertise_topics:
                        (parsed?.identity?.specializations || []).slice(0, 10),
                },
            };

            return {
                ...it,
                _source: "externe",
                external: true,
                sources: ["Vacataires", ...(Array.isArray(it?.sources) ? it.sources : [])],
                summary: it.summary || summaryFromParsed,
            };
        };
        return [...internal.map(tagInterne), ...vacataires.map(tagExterne)];
    }, [items]);

    const getType = (it) => {
        if (it?._source === "externe") return "externe";
        if (it?._source === "interne") return "interne";
        const raw =
            it?.type ??
            it?.kind ??
            it?.source_type ??
            (it?.external ? "externe" : "interne");
        return String(raw).toLowerCase().includes("exter") ? "externe" : "interne";
    };

    const SOURCE_LABELS = useMemo(
        () => ({
            EAP_Professeurs: t("dashboard_source_professors"),
            EAP_Administratif: t("dashboard_source_administrative"),
            EAP_EntretiensProfessionnels: t("dashboard_source_interviews"),
            Vacataires: t("dashboard_source_vacataires", "Vacataires"),
        }),
        [t]
    );

    const getName = (it) =>
        it?.summary?.identity?.name ||
        it?.parsed?.identity?.full_name ||
        it?.collab_key ||
        it?.full_name ||
        it?.name ||
        t("common.na", "—");

    const getRole = (it) =>
        it?.summary?.identity?.current_role ||
        it?.parsed?.identity?.current_title?.raw ||
        it?.parsed?.identity?.current_title?.normalized ||
        it?.current_role ||
        it?.role ||
        t("common.na", "—");

    const getInternalId = (it) =>
        it?.nip ??
        it?.NIP ??
        it?.nip_collab ??
        it?.matricule ??
        it?.matricule_collaborateur ??
        null;

    const stats = useMemo(() => {
        const base = {
            EAP_Professeurs: 0,
            EAP_Administratif: 0,
            EAP_EntretiensProfessionnels: 0,
            Vacataires: 0,
        };

        for (const it of normalizedItems) {
            const srcs = Array.isArray(it?.sources) ? it.sources : [];
            for (const s of srcs) {
                if (s in base) {
                    base[s] += 1;
                }
            }
        }
        return base;
    }, [normalizedItems]);

    const positionOptions = useMemo(
        () => [
            {
                value: "EAP_Professeurs",
                label: SOURCE_LABELS.EAP_Professeurs || "Professeurs",
            },
            {
                value: "EAP_Administratif",
                label: SOURCE_LABELS.EAP_Administratif || "Administratif",
            },
            {
                value: "EAP_EntretiensProfessionnels",
                label:
                    SOURCE_LABELS.EAP_EntretiensProfessionnels ||
                    "Entretiens professionnels",
            },
        ],
        [SOURCE_LABELS]
    );

    const filteredItems = useMemo(() => {
        const qLower = q.trim().toLowerCase();

        return normalizedItems.filter((it) => {
            const name = getName(it);
            const role = getRole(it);
            const type = getType(it);
            const srcs = Array.isArray(it?.sources) ? it.sources : [];
            const isVacataire = type === "externe";

            const isProfSource = srcs.includes("EAP_Professeurs");
            const isAdminSource = srcs.includes("EAP_Administratif");
            const isEntSource = srcs.includes("EAP_EntretiensProfessionnels");

            const hay = [
                name,
                role,
                it?.collab_key,
                ...srcs,
                type,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            const passQ = !qLower || hay.includes(qLower);

            let passType = true;
            if (personType === "interne") {
                passType = type === "interne";
            } else if (personType === "externe") {
                passType = isVacataire;
            } else {
                passType = true;
            }
            if (!passType) return false;

            let passPosition = true;

            if (position === "EAP_Professeurs") {
                if (type === "interne") {
                    passPosition = isProfSource;
                } else if (type === "externe") {
                    passPosition = true;
                }
            } else if (position === "EAP_Administratif") {
                if (type === "interne") {
                    passPosition = isAdminSource;
                } else {
                    passPosition = false;
                }
            } else if (position === "EAP_EntretiensProfessionnels") {
                if (type === "interne") {
                    passPosition = isEntSource;
                } else {
                    passPosition = false;
                }
            }

            if (!passPosition) return false;

            return passQ;
        });
    }, [normalizedItems, q, position, personType]);

    const onAction = (item, nextMode) => {
        setSelected(item);
        setMode(nextMode);
    };

    const closePane = () => {
        setSelected(null);
        setMode(null);
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;

        const fullName = getName(toDelete);

        const matriculeCollaborateur =
            toDelete.matricule_collaborateur ||
            toDelete.matricule ||
            null;

        const type = getType(toDelete);
        const category =
            type === "interne"
                ? "employee"
                : type === "externe"
                    ? "vacataire"
                    : undefined;

        const srcs = Array.isArray(toDelete?.sources) ? toDelete.sources : [];
        const ALLOWED = [
            "EAP_Professeurs",
            "EAP_Administratif",
            "EAP_EntretiensProfessionnels",
            "Vacataires",
        ];
        const positionKey = srcs.find((s) => ALLOWED.includes(s)) || null;

        try {
            await deleteAndRefresh({
                category,
                fullName,
                matriculeCollaborateur,
                position: positionKey,
            });
        } catch (e) {
        } finally {
            setToDelete(null);
        }
    };

    const isNumeric = (val) =>
        typeof val === "string" && /^[0-9]+$/.test(val.trim());
    const getInitials = (fullName) => {
        if (!fullName || typeof fullName !== "string") return "";
        const parts = fullName.trim().split(/\s+/);
        if (parts.length === 1) {
            return parts[0].slice(0, 2).toUpperCase();
        }
        const first = parts[0][0] || "";
        const last = parts[parts.length - 1][0] || "";
        return (first + last).toUpperCase();
    };

    return (
        <div className={styles.wrapper}>
            <div className={`${styles.page} ${isOpen ? styles.withPane : ""}`}>
                <div className={styles.left}>
                    <div className={styles.leftScroll}>
                        <div className={styles.headerContainer}>
                            <button
                                className={styles.backButton}
                                onClick={() => window.history.back()}
                            >
                                ← {t("back", "Changer de type")}
                            </button>

                            <h2 className={styles.title}>
                                {t("dashboard_analytics_title")}
                            </h2>
                        </div>

                        <div className={styles.titi}>
                            <TopStats stats={stats} loading={loading} />
                        </div>

                        <div className={styles.headerBar}>
                            <div className={styles.headerFilters}>
                                <div className={styles.pillSearchWrapper}>
                                    <input
                                        id="history-search"
                                        className={styles.searchInput}
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder={t("search", "Rechercher…")}
                                        aria-label={t("search", "Rechercher")}
                                    />

                                    <button
                                        type="button"
                                        className={styles.searchIconBtn}
                                        onClick={() => {
                                            if (q) setQ("");
                                        }}
                                        title={q ? t("clear", "Effacer") : t("search", "Rechercher")}
                                        aria-label={q ? t("clear", "Effacer") : t("search", "Rechercher")}
                                    >
                                        {q ? (
                                            <FiX className={styles.searchIconRight} />
                                        ) : (
                                            <MdManageSearch className={styles.searchIconRight} />
                                        )}
                                    </button>
                                </div>

                                <PillSelect
                                    value={position}
                                    onChange={setPosition}
                                    options={positionOptions}
                                    iconRight={<FiUsers />}
                                    className={styles.pillSelectWrapper}
                                />

                                <PillSelect
                                    value={personType}
                                    onChange={setPersonType}
                                    options={TYPE_OPTIONS}
                                    iconRight={<LuSettings />}
                                    className={styles.pillSelectWrapper}
                                />

                                <div className={styles.pill}>
                                    <button
                                        className={styles.clearLink}
                                        type="button"
                                        onClick={onClearFilters}
                                    >
                                        {t("filters_clear", "Réinitialiser les filtres")}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className={styles.loading}>{t("dashboard_loading")}</div>
                        ) : error ? (
                            <div className={styles.error}>
                                {t("dashboard_error")}: {String(error)}
                            </div>
                        ) : filteredItems.length === 0 ? (
                            <div className={styles.empty}>
                                {t(
                                    "no_users_found",
                                    "Aucun utilisateur trouvé. Veuillez ajouter de nouveaux utilisateurs dans la section Candidats."
                                )}
                            </div>
                        ) : (
                            <div className={styles.grid}>
                                {filteredItems.map((it) => {
                                    const type = getType(it);
                                    const isVacataire = type === "externe";
                                    const isInterne = type === "interne";
                                    const internalId = getInternalId(it);
                                    const rawName = getName(it);
                                    let name = rawName;
                                    const naLabel = t("common.na", "—");
                                    if (isInterne && (rawName === naLabel || !rawName) && internalId) {
                                        name = String(internalId);
                                    }
                                    const role =
                                        it?.Academic_Title ||
                                        it?.academic_title ||
                                        getRole(it);
                                    const avatarLabel = name || internalId || naLabel;
                                    const nameIsNumeric =
                                        name && typeof name === "string" && isNumeric(name);
                                    let avatarContent;
                                    if (isInterne && name && !nameIsNumeric) {
                                        avatarContent = getInitials(name);
                                    } else {
                                        avatarContent = <FiUsers />;
                                    }

                                    return (
                                        <div
                                            className={styles.card}
                                            key={
                                                internalId ||
                                                it.collab_key ||
                                                it.id ||
                                                it.matricule ||
                                                name ||
                                                avatarLabel
                                            }
                                        >
                                            <div className={styles.cardAvatar}>
                                                <div className={styles.avatar} aria-hidden="true">
                                                    {avatarContent}
                                                </div>
                                            </div>

                                            <div className={styles.cardBody}>
                                                <div className={styles.personName}>{name}</div>
                                                <div className={styles.personRole}>{role}</div>
                                            </div>

                                            <div className={styles.cardActionsCenter}>
                                                <button
                                                    className={styles.iconBtn}
                                                    title={t("actions.view_data", "View")}
                                                    aria-label={t("actions.view_data", "View")}
                                                    onClick={() => onAction(it, "view")}
                                                >
                                                    <LuEye />
                                                </button>
                                                <button
                                                    className={styles.iconBtn}
                                                    title={
                                                        isVacataire
                                                            ? t("actions.experience", "Experience")
                                                            : t("actions.history", "History")
                                                    }
                                                    aria-label={
                                                        isVacataire
                                                            ? t("actions.experience", "Experience")
                                                            : t("actions.history", "History")
                                                    }
                                                    onClick={() => onAction(it, "history")}
                                                >
                                                    {isVacataire ? <LuHistory /> : <LuBookOpen />}                                                </button>
                                                {isVacataire && (
                                                    <button
                                                        className={`${styles.iconBtn} ${styles.danger}`}
                                                        title={t("actions.delete", "Delete")}
                                                        aria-label={t("actions.delete", "Delete")}
                                                        onClick={() => setToDelete(it)}
                                                    >
                                                        <LuTrash2 />
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                        )}
                    </div>
                </div>

                {isOpen && (
                    <div className={styles.sidePaneOverlay}>
                        <div className={styles.sidePaneScroll}>
                            <SidePane open onClose={closePane} item={selected} mode={mode} />
                        </div>
                    </div>
                )}

                <Modal
                    variant="danger"
                    open={!!toDelete}
                    title={t("deletetitle")}
                    onClose={() => setToDelete(null)}
                    onConfirm={handleConfirmDelete}
                    confirmText={t("deleteconfirm")}
                    showCancel
                    cancelText={t("deletecancel")}
                >
                    {!updating && <p>{t("deletewarning")}</p>}

                    {updating && (
                        <div className={styles.loaderWrapper}>
                            <div className={styles.spinner}></div>
                        </div>
                    )}
                </Modal>
            </div>
        </div>
    );
}
