import React, { useContext, useState } from "react";
import styles from "./ProcessButton.module.css";
import { ThemeContext } from "../../../../../context/ThemeContext";
import { useSession } from "../../../../../context/SessionContext";
import { useTranslation } from "../../../../../utils/useTranslation";
import { extractDocuments } from "../../../../../features/documentService";
import ErrorModal from "../ErrorModal/ErrorModal";

const ProcessButton = () => {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isErrorOpen, setIsErrorOpen] = useState(false);

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const {
    docType,
    uploadedFiles,
    setExtractedData,
    setSelectedCards,
    setDetectedCountries,
    setFilterMode,
    setSelectedCountry,
    setSearchTerm,
  } = useSession();

  const { t } = useTranslation();

  const handleClick = async () => {
    if (loading) return;

    if (!docType) {
      alert("Veuillez sélectionner un type de document.");
      return;
    }

    if (!uploadedFiles || uploadedFiles.length === 0) {
      alert("Veuillez ajouter au moins un fichier.");
      return;
    }

    setExtractedData(null);
    setSelectedCards([]);
    setDetectedCountries([]);
    setFilterMode("Manually");
    setSelectedCountry("anywhere");
    setSearchTerm("");

    setLoading(true);

    try {
      const result = await extractDocuments(docType, uploadedFiles);

      const docsArray = Array.isArray(result)
        ? result
        : Array.isArray(result?.documents)
        ? result.documents
        : [];

      const enrichedDocs = docsArray.map((doc, index) => ({
        ...doc,
        _sourceFileIndex: index,
        _sourceFileName: uploadedFiles[index]?.name || `file_${index}`,
      }));

      let safeDocs = null;
      try {
        safeDocs =
          enrichedDocs != null
            ? JSON.parse(JSON.stringify(enrichedDocs))
            : null;
      } catch (e) {
        safeDocs = null;
      }

      setExtractedData(safeDocs);
    } catch (err) {
      setErrorMessage(t("unexpected_error"));
      setIsErrorOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const closeErrorModal = () => {
    setIsErrorOpen(false);
    setErrorMessage("");
  };

  return (
    <div className={styles.centerWrapper}>
      <button
        className={`
          ${styles.btn}
          ${isDark ? styles.btnDark : styles.btnLight}
          ${loading ? styles.btnLoading : ""}
        `}
        onClick={handleClick}
        disabled={loading || uploadedFiles.length === 0}
      >
        {loading ? (
          <img
            src="https://media.giphy.com/media/RllBwZbQXxreT46dqp/giphy.gif"
            alt="loading"
            style={{ width: "10vw", height: "10vw" }}
          />
        ) : (
          t("startProcess")
        )}
      </button>
      <ErrorModal
        isOpen={isErrorOpen}
        message={errorMessage}
        onClose={closeErrorModal}
      />
    </div>
  );
};

export default ProcessButton;
