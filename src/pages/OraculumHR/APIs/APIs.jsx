import React, { useState } from "react";
import MainLayout from "../../../layouts/MainLayout";
import UploadZone from "../../../components/Oracculum/features/APIs/UploadZone/UploadZone";
import DocTypeModal from "../../../components/Oracculum/features/APIs/DocTypeModal/DocTypeModal";
import DocTypeSelector from "../../../components/Oracculum/features/APIs/DocTypeSelector/DocTypeSelector";
import ProcessButton from "../../../components/Oracculum/features/APIs/ProcessButton/ProcessButton";
import FilterBar from "../../../components/Oracculum/features/APIs/FilterBar/FilterBar";
import styles from "./APIs.module.css";
import DownloadFormatSelect from "../../../components/Oracculum/features/APIs/DownloadFormatSelect/DownloadFormatSelect";
import { useSession, SessionProvider } from "../../../context/SessionContext";
import ResultList from "../../../components/Oracculum/features/APIs/ResultList/ResultList";
import { useTranslation } from "../../../utils/useTranslation";

const APIsInner = () => {
  const [showModal, setShowModal] = useState(false);
  const { extractedData } = useSession();
  const [format, setFormat] = useState("PDF");
  const { t } = useTranslation();

  return (
    <MainLayout>
       <div className={styles.header}>
              <h1 className={styles.title}>{t("api_title")}</h1>
              <p className={styles.description}>
                {t("api_desc")}
              </p>
            </div>
      <div className={styles.mainSection}>
        
        <div className={styles.upload}>
          <UploadZone forceFixedHeight={true} />
        </div>

        <div className={styles.selector}>
          <DocTypeSelector
            onEdit={() => setShowModal(true)}
            forceFixedHeight={true}
            editable={true}
          />
        </div>
      </div>

      <ProcessButton />

      {extractedData?.length > 0 && (
        <>
          <FilterBar />
          <DownloadFormatSelect value={format} onChange={setFormat} />
          <ResultList />
        </>
      )}

      {showModal && <DocTypeModal onClose={() => setShowModal(false)} />}
    </MainLayout>
  );
};

const APIs = () => {
  return (
    <SessionProvider serviceKey="apis">
      <APIsInner />
    </SessionProvider>
  );
};

export default APIs;
