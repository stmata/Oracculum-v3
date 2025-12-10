import React from "react";
import styles from "./FeatureCard.module.css";
import { LuArrowUpRight } from "react-icons/lu";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../../../../../utils/useTranslation";

export default function FeatureCard({
  description,
  title,
  onClick,
  to,
  ariaLabel,
  disabled = false,
}) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleClick = () => {
    if (disabled) return;
    if (to) {
      navigate(to);
    } else if (onClick) {
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`${styles.featureCard} ${disabled ? styles.isDisabled : ""}`}
      onClick={handleClick}
      aria-label={ariaLabel || title}
      disabled={disabled}
    >
      <div className={styles.top}>
        <p className={styles.desc}>{description}</p>
        <div className={styles.rule} aria-hidden="true" />
      </div>

      <div className={styles.bottom}>
        <h3
          className={styles.title}
          data-comingsoon={
            disabled ? t("coming_soon", "Bientôt disponible") : ""
          }
        >
          {title}
        </h3>

        <span className={styles.arrow} aria-hidden="true">
          <LuArrowUpRight />
        </span>
      </div>
    </button>
  );
}
