import React, { useContext } from "react";
import styles from "./DocTypeModal.module.css";
import { useSession } from "../../../../../context/SessionContext";
import { useTranslation } from "../../../../../utils/useTranslation";
import idCardImg from "../../../../../assets/images/idcard.jpg";
import passportImg from "../../../../../assets/images/passport.jpg";
import resumeImg from "../../../../../assets/images/cv.png";
import socialSecurityImg from "../../../../../assets/images/ss.jpg";
import diplomaImg from "../../../../../assets/images/diploma.jpg";
import { ThemeContext } from "../../../../../context/ThemeContext";
import localforage from "localforage";

const docTypes = [
  { id: "idcard", labelKey: "idCard", image: idCardImg },
  { id: "passport", labelKey: "passport", image: passportImg },
  { id: "resume", labelKey: "resume", image: resumeImg },
  { id: "diploma", labelKey: "diploma", image: diplomaImg },
  { id: "social_security", labelKey: "social_security", image: socialSecurityImg },
];

const DocTypeModal = ({ onClose }) => {
  const {
    docType,
    setUploadedFiles,
    setUploadedFileInfos,
    setUploadedFilesBase64,
    uploadedFilesBase64,
    setExtractedData,
    setSelectedCards,
    setDetectedCountries,
    setFilterMode,
    setSelectedCountry,
    setSearchTerm,
    setShowList,
    setDocType,
  } = useSession();

  const { t } = useTranslation();
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const handleClickOutside = (e) => {
    if (e.target.classList.contains(styles.overlay)) {
      onClose();
    }
  };

  const handleSelectType = (typeId) => {
    if (Array.isArray(uploadedFilesBase64)) {
      uploadedFilesBase64.forEach((ref) => {
        if (ref?.key) {
          localforage.removeItem(ref.key).catch(() => { });
        }
      });
    }

    setUploadedFiles([]);
    setUploadedFileInfos([]);
    setUploadedFilesBase64([]);
    setExtractedData(null);
    setSelectedCards([]);
    setDetectedCountries([]);
    setFilterMode("Manually");
    setSelectedCountry("anywhere");
    setSearchTerm("");
    setShowList(false);
    setDocType(typeId);
    onClose();
  };

  return (
    <div
      className={`${styles.overlay} ${isDark ? styles.dark : ""}`}
      onClick={handleClickOutside}
    >
      <div className={`${styles.modal} ${isDark ? styles.dark : ""}`}>
        <h3 className={`${styles.title} ${isDark ? styles.darkTitle : ""}`}>
          {t("chooseDocType")}
        </h3>

        <div className={styles.typeGrid}>
          {docTypes.map((type) => (
            <div
              key={type.id}
              className={`${styles.typeCard} ${docType === type.id ? styles.active : ""
                }`}
              onClick={() => handleSelectType(type.id)}
            >
              <img
                src={type.image}
                alt={type?.labelKey ? t(type.labelKey) : ""}
                className={styles.cardImage}
              />
              <div className={styles.label}>
                {type?.labelKey ? t(type.labelKey) : ""}
              </div>
            </div>
          ))}
        </div>

        <button className={styles.closeBtn} onClick={onClose}>
          {t("cancel")}
        </button>
      </div>
    </div>
  );
};

export default DocTypeModal;
