import React, { useContext } from "react";
import styles from "./DocTypeSelector.module.css";
import { FiEdit2 } from "react-icons/fi";
import { ThemeContext } from "../../../../../context/ThemeContext";
import { useSession } from "../../../../../context/SessionContext";
import idCardImg from "../../../../../assets/images/idcard.jpg";
import passportImg from "../../../../../assets/images/passport.jpg";
import resumeImg from "../../../../../assets/images/cv.png";
import diplomaImg from "../../../../../assets/images/diploma.jpg";
import bankImg from "../../../../../assets/images/card.jpg";
import socialSecurityImg from "../../../../../assets/images/ss.jpg";

const docTypes = {
  idcard: {
    label: "ID Card",
    image: idCardImg,
  },
  passport: {
    label: "Passport",
    image: passportImg,
  },
  resume: {
    label: "Resume",
    image: resumeImg,
  },
  diploma: {
    label: "Diploma",
    image: diplomaImg,
  },
  bank: {
    label: "Bank Doc",
    image: bankImg,
  },
  social_security: {
    label: "Social Security",
    image: socialSecurityImg,
  },
};

const DocTypeSelector = ({
  onEdit,
  forceFixedHeight = false,
  selected,
  editable = true,
}) => {
  const { docType } = useSession();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const effectiveDocTypeKey = selected || docType || "idcard";
  const { label, image } =
    docTypes[effectiveDocTypeKey] || docTypes["idcard"];

  return (
    <div
      className={`${styles.card} ${forceFixedHeight ? styles.fixedHeight : ""
        } ${isDark ? styles.dark : ""}`}
    >
      <div className={styles.imageWrapper}>
        <img src={image} alt={label} className={styles.bgImage} />

        {editable && onEdit && (
          <button
            className={styles.editBtn}
            onClick={onEdit}
            title="Change document type"
          >
            <FiEdit2 />
          </button>
        )}
      </div>
    </div>
  );
};

export default DocTypeSelector;
