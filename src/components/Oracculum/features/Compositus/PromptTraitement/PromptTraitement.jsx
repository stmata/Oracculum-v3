import React, { useState } from "react";
import styles from "./PromptTraitement.module.css";
import { useTranslation } from "../../../../../utils/useTranslation";

import PillSelect from "../utils/PillSelect/PillSelect";
import { BsFilterRight } from "react-icons/bs";
import { TbFiles } from "react-icons/tb";

export default function PromptTraitement() {
    const { t } = useTranslation();

    const [selectedDep, setSelectedDep] = useState("All");
    const [staffType, setStaffType] = useState("internal");
    const [saveDocs, setSaveDocs] = useState("yes");
    const [textPrompt, setTextPrompt] = useState("");

    return (
        <div className={styles.mainContainer}>
            <div className={styles.filtersBlock}>
                <h3 className={styles.filtersTitle}>
                    {t("ut_filters_title", "Filtres rapides d’analyse")}
                </h3>
                <p className={styles.filtersSubtitle}>
                    {t(
                        "ut_filters_subtitle",
                        "Ajustez les filtres avant de lancer le matching pour obtenir des résultats adaptés à vos critères."
                    )}
                </p>

                <div className={styles.filtersRow}>
                    <PillSelect
                        value={selectedDep}
                        onChange={setSelectedDep}
                        options={[
                            { value: "All", label: t("dep_all", "Tous les départements") },
                            { value: "EAP_Professors", label: t("dep_eap_professors", "EAP Professeurs") },
                            { value: "EAP_Administratif", label: t("dep_eap_admin", "EAP Administratif") },
                            { value: "EAP_Professional_Interviews", label: t("dep_eap_interviews", "EAP Entretiens Professionnels") },
                        ]}
                        placeholder={t("ut_choose_department", "Département")}
                        iconRight={<BsFilterRight />}
                    />

                    <PillSelect
                        value={staffType}
                        onChange={setStaffType}
                        options={[
                            { value: "all", label: t("source_all", "Interne + Externe") },
                            { value: "internal", label: t("source_internal", "Interne seulement") },
                            { value: "external", label: t("source_external", "Externe seulement") },
                        ]}
                        placeholder={t("ut_candidate_source", "Source des candidats")}
                        iconRight={<BsFilterRight />}
                    />

                    <PillSelect
                        value={saveDocs}
                        onChange={setSaveDocs}
                        options={[
                            { value: "yes", label: t("yes", "Oui, enregistrer l’offre") },
                            { value: "no", label: t("no", "Ne pas enregistrer") },
                        ]}
                        placeholder={t("ut_save_results", "Sauvegarde")}
                        iconRight={<BsFilterRight />}
                    />
                </div>
            </div>

            <section className={`${styles.uploadCard} ${styles.appear}`}>
                <div className={styles.extTopRow}>
                    <span className={styles.extSmallIcon} aria-hidden><TbFiles /></span>
                    <span className={styles.extTypePill}>
                        {t("pt_type_label", "Brief / Texte")}
                    </span>                </div>

                <h3 className={styles.extTitle}>
                    {t("pt_type_request", "Décrire le besoin")}
                </h3>
                <p className={styles.extDesc}>
                    {t(
                        "pt_manual_desc",
                        "Saisissez l’offre ou les éléments clés du poste (mission, expériences requises, compétences, mots-clés…). Le système analysera ce texte et fera le matching automatiquement."
                    )}
                </p>
                <textarea
                    className={styles.textAreaFixed}
                    placeholder={t(
                        "pt_placeholder",
                        "Ex. : Nous recherchons un Data Analyst (Python, SQL, Power BI)…"
                    )}
                    value={textPrompt}
                    onChange={(e) => setTextPrompt(e.target.value)}
                />
                <div className={styles.counterRow}>
                    <span className={styles.counterLabel}>
                        {t("chars", "Caractères")} : {textPrompt.length}
                    </span>
                </div>
            </section>

            <div className={styles.actionBar}>
                <button
                    className={`${styles.startBtn} ${styles.normalBtn}`}
                    disabled={!textPrompt.trim()}
                    onClick={() => {
                    }}
                >
                    {t("start", "Commencer")}
                </button>
            </div>
        </div>
    );
}
