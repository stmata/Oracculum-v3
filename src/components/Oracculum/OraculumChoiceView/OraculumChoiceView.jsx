import React from "react";
import styles from "./OraculumChoiceView.module.css";
import { useTranslation } from "../../../utils/useTranslation";

const OraculumChoiceView = ({ user, options, onSelect }) => {
    const scope = user?.access_scope || "none";
    const { t } = useTranslation();

    const isDisabled = (opt) => {
        if (opt.enabled === false) return true;

        if (scope === "all") return false;
        return scope !== opt.key;
    };

    const isDisabledByScope = (opt) => {
        if (scope === "all") return false;
        if (opt.enabled === false) return false;
        return scope !== opt.key;
    };

    const sortedOptions = [
        ...options.filter((opt) => !isDisabledByScope(opt)),
        ...options.filter((opt) => isDisabledByScope(opt)),
    ];

    return (
        <div className={styles.page}>
            <div className={styles.header}>
                <h1 className={styles.title}>{t("oraculum_title")}</h1>
                <p className={styles.subtitle}>{t("oraculum_subtitle")}</p>
                <p className={styles.helper}>{t("oraculum_choice_intro")}</p>
            </div>

            <div className={styles.grid}>
                {sortedOptions.map((opt) => {
                    const disabled = isDisabled(opt);

                    return (
                        <button
                            key={opt.key}
                            type="button"
                            className={`${styles.card} ${disabled ? styles.disabled : ""}`}
                            style={{ backgroundImage: `url(${opt.icon})` }}
                            disabled={disabled}
                            onClick={() => {
                                if (!disabled) onSelect(opt.path);
                            }}
                        >
                            <div className={styles.overlay}></div>

                            {opt.enabled === false && (
                                <div className={styles.comingSoonTag}>
                                    {t("coming_soon")}
                                </div>
                            )}

                            {opt.enabled !== false && disabled && (() => {
                                const taglock = t("taglock") || "";
                                const [line1, line2] = taglock.split("\n");

                                return (
                                    <div className={styles.lockTag}>
                                        {line1}
                                        {line2 && (
                                            <>
                                                <br />
                                                {line2}
                                            </>
                                        )}
                                    </div>
                                );
                            })()}


                            <div className={styles.content}>
                                <h2 className={styles.cardTitle}>{opt.label}</h2>
                                <p className={styles.cardDesc}>{opt.description}</p>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

export default OraculumChoiceView;
