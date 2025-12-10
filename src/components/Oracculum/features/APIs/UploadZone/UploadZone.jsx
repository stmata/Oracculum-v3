import React, { useRef, useContext, useCallback, useMemo } from "react";
import styles from "./UploadZone.module.css";
import { useSession } from "../../../../../context/SessionContext";
import { useTranslation } from "../../../../../utils/useTranslation";
import { ThemeContext } from "../../../../../context/ThemeContext";
import { PiEyeClosed } from "react-icons/pi";
import { FaRegEye } from "react-icons/fa";
import { AiOutlineFilePdf } from "react-icons/ai";
import { SiContactlesspayment } from "react-icons/si";
import { LiaIdCard } from "react-icons/lia";
import { GiPassport } from "react-icons/gi";
import { PiReadCvLogo } from "react-icons/pi";
import { LuGraduationCap } from "react-icons/lu";
import { MdHealthAndSafety, MdClose } from "react-icons/md";
import localforage from "localforage";

const UploadZone = ({
  onFilesSelected,
  forceFixedHeight = false,
  persistBase64 = true,
}) => {
  const fileInputRef = useRef();

  const {
    docType,
    uploadedFiles,
    uploadedFileInfos,
    uploadedFilesBase64,
    setUploadedFiles,
    setUploadedFileInfos,
    setUploadedFilesBase64,
    setExtractedData,
    setSelectedCards,
    setDetectedCountries,
    setFilterMode,
    setSelectedCountry,
    setSearchTerm,
    showList,
    setShowList,
    removeUploadedFileAt,
  } = useSession();

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const { t } = useTranslation();

  const fileAccept =
    docType === "resume"
      ? ".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : ".jpg,.jpeg,.png,.pdf,.doc,.docx,image/jpeg,image/png,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  const displayFiles = useMemo(
    () => (Array.isArray(uploadedFileInfos) ? uploadedFileInfos : []),
    [uploadedFileInfos]
  );

  const safeUploadedFilesBase64 = useMemo(
    () => (Array.isArray(uploadedFilesBase64) ? uploadedFilesBase64 : []),
    [uploadedFilesBase64]
  );

  const persistFilesInIndexedDb = useCallback(
    async (selectedFiles) => {
      const refs = await Promise.all(
        selectedFiles.map(async (file, idx) => {
          const key = `oraculum_file_${Date.now()}_${idx}_${file.name}`;
          try {
            await localforage.setItem(key, file);
          } catch (err) {
          }
          return {
            name: file.name,
            size: file.size,
            type: file.type,
            lastModified: file.lastModified,
            key,
          };
        })
      );
      setUploadedFilesBase64(refs);
    },
    [setUploadedFilesBase64]
  );

  const processFiles = useCallback(
    async (selectedFiles) => {
      if (!selectedFiles || selectedFiles.length === 0) return;

      setExtractedData(null);
      setSelectedCards([]);
      setDetectedCountries([]);
      setFilterMode("Manually");
      setSelectedCountry("anywhere");
      setSearchTerm("");
      setUploadedFiles(selectedFiles);

      const fileInfos = selectedFiles.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
      }));
      setUploadedFileInfos(fileInfos);

      if (persistBase64) {
        await persistFilesInIndexedDb(selectedFiles);
      } else {
        setUploadedFilesBase64([]);
      }

      onFilesSelected?.(selectedFiles);
      setShowList(true);

      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [
      persistBase64,
      onFilesSelected,
      setUploadedFiles,
      setUploadedFileInfos,
      setUploadedFilesBase64,
      setShowList,
      setExtractedData,
      setSelectedCards,
      setDetectedCountries,
      setFilterMode,
      setSelectedCountry,
      setSearchTerm,
      persistFilesInIndexedDb,
    ]
  );

  const handleChange = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    await processFiles(selectedFiles);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer?.files || []);
    await processFiles(droppedFiles);
  };

  const onDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const handleRemoveFile = useCallback(
    (index) => {
      const refToDelete =
        safeUploadedFilesBase64[index] && safeUploadedFilesBase64[index].key
          ? safeUploadedFilesBase64[index]
          : null;

      if (refToDelete?.key) {
        localforage.removeItem(refToDelete.key).catch(() => { });
      }
      removeUploadedFileAt(index);
    },
    [safeUploadedFilesBase64, removeUploadedFileAt]
  );

  const getDocConfig = (type) => {
    switch (type) {
      case "bank":
        return {
          Icon: SiContactlesspayment,
          helperTitle: t(
            "upload_bank_title",
            "Téléverser des relevés bancaires"
          ),
          helperDesc: t(
            "upload_bank_desc",
            "Importez vos relevés pour extraire IBAN, BIC, titulaire, périodes et montants."
          ),
          badgeText: t("format_files", "PDF / Images de relevés"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • PDF / JPG / PNG"
          ),
        };
      case "idcard":
      case "card":
        return {
          Icon: LiaIdCard,
          helperTitle: t(
            "upload_id_title",
            "Téléverser des cartes d’identité"
          ),
          helperDesc: t(
            "upload_id_desc",
            "Importez vos cartes pour extraire nom, date de naissance, numéro de document, pays, etc."
          ),
          badgeText: t("format_files", "JPG / PNG / PDF"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • JPG / PNG / PDF"
          ),
        };
      case "passport":
        return {
          Icon: GiPassport,
          helperTitle: t(
            "upload_passport_title",
            "Téléverser des passeports"
          ),
          helperDesc: t(
            "upload_passport_desc",
            "Importez vos passeports pour extraire identité, dates de validité et pays d’émission."
          ),
          badgeText: t("format_files", "JPG / PNG / PDF"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • JPG / PNG / PDF"
          ),
        };
      case "resume":
        return {
          Icon: PiReadCvLogo,
          helperTitle: t(
            "upload_resume_title",
            "Téléverser des CV / Résumés"
          ),
          helperDesc: t(
            "upload_resume_desc",
            "Chaque CV sera analysé : identité, expérience, formation, compétences, centres d’intérêt…"
          ),
          badgeText: t("format_files", "PDF / DOCX / DOC"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • PDF / DOCX / DOC"
          ),
        };
      case "diploma":
        return {
          Icon: LuGraduationCap,
          helperTitle: t(
            "upload_diploma_title",
            "Téléverser des diplômes / certificats"
          ),
          helperDesc: t(
            "upload_diploma_desc",
            "Importez diplômes et certificats pour extraire établissement, niveau, spécialité et dates."
          ),
          badgeText: t("format_files", "Images / PDF"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • JPG / PNG / PDF"
          ),
        }; case "social_security":
        return {
          Icon: LiaIdCard,
          helperTitle: t(
            "upload_social_title",
            "Téléverser des cartes de sécurité sociale"
          ),
          helperDesc: t(
            "upload_social_desc",
            "Importez vos cartes de sécurité sociale pour extraire nom, numéro, dates de validité et pays."
          ),
          badgeText: t("format_files", "JPG / PNG / PDF"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • JPG / PNG / PDF"
          ),
        };
      case "assurance":
      case "insurance":
        return {
          Icon: MdHealthAndSafety,
          helperTitle: t(
            "upload_insurance_title",
            "Téléverser des documents d’assurance"
          ),
          helperDesc: t(
            "upload_insurance_desc",
            "Importez contrats ou attestations pour extraire numéro de police, garanties, dates et organisme."
          ),
          badgeText: t("format_files", "PDF / Images"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • PDF / JPG / PNG"
          ),
        };
      default:
        return {
          Icon: AiOutlineFilePdf,
          helperTitle: t("upload_docs_title", "Téléverser des documents"),
          helperDesc: t(
            "upload_docs_desc",
            "Téléversez vos documents pour lancer l’analyse et l’extraction des informations."
          ),
          badgeText: t("format_files", "Images / PDF / DOCX / DOC"),
          hintText: t(
            "upload_meta_file",
            "Taille max 20 Mo / fichier • JPG / PNG / PDF / DOCX / DOC"
          ),
        };
    }
  };

  const { Icon, helperTitle, helperDesc, badgeText, hintText } =
    getDocConfig(docType);

  return (
    <section
      className={`${styles.uploadZone} ${isDark ? styles.dark : ""} ${forceFixedHeight ? styles.fixedHeight : ""
        }`}
    >
      <div className={styles.uploadHeader}>
        <div className={styles.headerText}>
          <div className={styles.headerTitleRow}>
            <span className={styles.docIcon}>
              <Icon />
            </span>
            <h3 className={styles.choiceTitle}>{helperTitle}</h3>
          </div>
          <p className={styles.choiceDesc}>{helperDesc}</p>
        </div>
        <span className={styles.choiceBadge}>{badgeText}</span>
      </div>

      <label
        className={styles.picker}
        onDragOver={onDragOver}
        onDrop={handleDrop}
        tabIndex={0}
        aria-label={t("upload_title_plural", "Dépose tes fichiers ici")}
      >
        <div className={styles.pickLeft} aria-hidden>
          📄
        </div>
        <div className={styles.pickTexts}>
          <div className={styles.pickTitle}>
            {t("upload_title_plural", "Dépose tes fichiers ici")}
          </div>
          <div className={styles.pickHint}>{hintText}</div>
        </div>

        <input
          ref={fileInputRef}
          className={styles.fileInput}
          type="file"
          multiple
          accept={fileAccept}
          onChange={handleChange}
        />
      </label>

      <div className={styles.listHeader}>
        <span className={styles.listTitle}>
          {t("selected_files", "Fichiers sélectionnés")}
          {displayFiles.length > 0 ? ` (${displayFiles.length})` : ""}
        </span>
        <button
          className={`${styles.eyeToggle} ${showList ? styles.active : ""}`}
          onClick={() => setShowList((prev) => !prev)}
          title={
            showList
              ? t("hideFiles", "Masquer la liste")
              : t("showFiles", "Afficher la liste")
          }
        >
          {showList ? <FaRegEye /> : <PiEyeClosed />}
        </button>
      </div>

      {showList && (
        <div className={styles.list}>
          {displayFiles.length === 0 ? (
            <div className={styles.fileMuted}>
              {t(
                "no_docs_yet",
                "Aucun document sélectionné pour l’instant."
              )}
            </div>
          ) : (
            displayFiles.map((file, idx) => {
              const name = file?.name || t("unknown_file", "Fichier");
              const size =
                typeof file?.size === "number"
                  ? `${(file.size / 1024).toFixed(2)} KB`
                  : null;

              return (
                <div key={idx} className={styles.fileRowModern}>
                  <div className={styles.fileThumb} aria-hidden>
                    <AiOutlineFilePdf className={styles.fileThumbIcon} />
                  </div>

                  <div className={styles.fileInfo}>
                    <div className={styles.fileName} title={name}>
                      {idx + 1}. {name}
                    </div>
                    {size && (
                      <div className={styles.fileSize}>{size}</div>
                    )}
                  </div>

                  <div className={styles.fileActions}>
                    <button
                      className={styles.fileActionBtn}
                      onClick={() => handleRemoveFile(idx)}
                      title={t("remove_file", "Retirer le fichier")}
                      aria-label={t("remove_file", "Retirer le fichier")}
                    >
                      <MdClose />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </section>
  );
};

export default UploadZone;
