import React, { useState } from "react";
import styles from "./CandidatesDashboard.module.css";
import { useTranslation } from "../../../../../../utils/useTranslation";
import Modal from "../../Modal/Modal";
import FeatureCard from "./FeatureCard/FeatureCard";

const CandidatesDashboard = () => {
    const { t } = useTranslation();
    const [showInfo, setShowInfo] = useState(false);
    const openWarning = () => setShowInfo(true);
    const closeWarning = () => setShowInfo(false);

    return (
        <div className={styles.candidatesContainer}>
            <div className={styles.sectionHeaderRow}>
                <button
                    type="button"
                    className={styles.ghostPillBtn}
                    onClick={openWarning}
                    aria-haspopup="dialog"
                    aria-controls="data-warning-modal"
                >
                    {t("what_happens_button")}
                </button>

                <div className={styles.rightIntro}>
                    <h2 className={styles.rightTitle}>
                        {t("we_take_hiring")}{" "}
                        <span className={styles.rightTitleAccent}>{t("scalability")}</span>{" "}
                        {t("based_on_requirements")}
                    </h2>
                    <p className={styles.rightSubtle}>{t("legal_env_passed")}</p>
                </div>
            </div>

            <div className={styles.cardGrid3}>
                <FeatureCard
                    description={t("see_all_desc")}
                    title={t("see_all_candidates")}
                    to="/candidates/101"
                />
                <FeatureCard
                    description={t("edit_internal_desc")}
                    title={t("edit_internal_data")}
                    to="/candidates/202"
                />
                <FeatureCard
                    description={t("manage_external_desc")}
                    title={t("manage_external_data")}
                    to="/candidates/303"
                />
            </div>

            <Modal
                variant="warning"
                size="half"
                accentTitle
                open={showInfo}
                onClose={closeWarning}
                onConfirm={closeWarning}
                title={t("data_warning_title")}
                confirmText={t("got_it")}
                showCancel={false}
            >
                <p>{t("data_warning_body")}</p>
            </Modal>


        </div >
    );
};

export default CandidatesDashboard;
