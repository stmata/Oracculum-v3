import React from "react";
import styles from "./JobDescriptionCard.module.css";
import JobPreviewCard from "../JobPreviewCard/JobPreviewCard";

const JobDescriptionCard = ({ job }) => {
    if (!job) return null;

    return (
        <div className={styles.jobCard}>

            <button
                className={styles.backButton}
                onClick={() => window.history.back()}
            >
                ← Retour
            </button>

            <JobPreviewCard job={job} />
        </div>
    );
};

export default JobDescriptionCard;
