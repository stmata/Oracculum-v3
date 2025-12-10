import React from "react";
import styles from "./CertificatesHome.module.css";
import { FaPlus, FaList, FaShapes } from "react-icons/fa";
import { useTranslation } from "../../../../../../utils/useTranslation";
import FeatureCard from "../CandidatesDashboard/FeatureCard/FeatureCard";

const CertificatesHome = () => {
    const { t } = useTranslation();

    const openSkemaCertificates = () => {
        window.open(
            "https://www.skema.edu/en/executive-education/certificates",
            "_blank",
            "noopener,noreferrer"
        );
    };

    return (
        <div className={styles.certsContainer}>
            <div className={styles.sectionHeaderRow}>
                <button
                    type="button"
                    className={styles.ghostPillBtn}
                    onClick={openSkemaCertificates}
                >
                    {t("skemaCertificatesLink", "SKEMA Certificates (official website)")}
                </button>
                <div className={styles.rightIntro}>
                    <h2 className={styles.rightTitle}>
                        {t("certificates_title_part1", "Suivez et organisez les")}{" "}
                        <span className={styles.rightTitleAccent}>
                            {t("certificates_title_highlight", "certificats essentiels")}
                        </span>{" "}
                        {t("certificates_title_part2", "pour renforcer l’adéquation des candidats")}
                    </h2>

                    <p className={styles.rightSubtle}>
                        {t(
                            "certificates_description",
                            "Ces certificats proviennent principalement du site officiel de SKEMA et servent à identifier les formations pertinentes lorsqu’un candidat présente des compétences manquantes. Ils facilitent l’adéquation au poste en recommandant les parcours à suivre avant ou après l’embauche."
                        )}
                    </p>
                </div>

            </div>

            <div className={styles.cardGrid3}>
                <FeatureCard
                    disabled
                    description={t(
                        "certificates_card_text",
                        "Consulte tous les certificats déjà enregistrés dans la plateforme."
                    )}
                    title={t("certificates_card_title", "Voir mes certificats")}
                />

                <FeatureCard
                    disabled
                    description={t(
                        "certificates_add_internal_text",
                        "Uploade un certificat lié à un collaborateur interne et rattache-le à son profil."
                    )}
                    title={t("certificates_add_internal_title", "Ajouter un certificat interne")}
                />

                <FeatureCard
                    disabled
                    description={t(
                        "certificates_add_external_text",
                        "Uploade un certificat pour un candidat externe et lie-le à son profil ou à une session."
                    )}
                    title={t("certificates_add_external_title", "Ajouter un certificat externe")}
                />
            </div>


        </div>
    );
};

export default CertificatesHome;
