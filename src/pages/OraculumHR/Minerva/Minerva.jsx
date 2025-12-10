import React, { useState, useEffect } from "react";
import MainLayout from "../../../layouts/MainLayout";
import UploadZone from "../../../components/Oracculum/features/APIs/UploadZone/UploadZone";
import DocTypeSelector from "../../../components/Oracculum/features/APIs/DocTypeSelector/DocTypeSelector";
import ProcessButton from "../../../components/Oracculum/features/APIs/ProcessButton/ProcessButton";
import FilterBar from "../../../components/Oracculum/features/APIs/FilterBar/FilterBar";
import styles from "./Minerva.module.css";
import DownloadFormatSelect from "../../../components/Oracculum/features/APIs/DownloadFormatSelect/DownloadFormatSelect";
import { useSession, SessionProvider } from "../../../context/SessionContext";
import ResultList from "../../../components/Oracculum/features/APIs/ResultList/ResultList";
import { useTranslation } from "../../../utils/useTranslation";

const MinervaInner = () => {
  const { extractedData, setDocType } = useSession();
  const [format, setFormat] = useState("PDF");
const { t } = useTranslation();
  useEffect(() => {
    setDocType("bank");
  }, [setDocType]); 

  return (
    <MainLayout>
      <div className={styles.header}>
        <h1 className={styles.title}>{t("minerva_title")}</h1>
        <p className={styles.description}>
          {t("minerva_description")}
        </p>
      </div>

      <div className={styles.mainSection}>
        <div className={styles.upload}>
          <UploadZone forceFixedHeight={true} />
        </div>

        <div className={styles.selector}>
          <DocTypeSelector forceFixedHeight={true} editable={false} />
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
    </MainLayout>
  );
};

const Minerva = () => {
  return (
    <SessionProvider serviceKey="minerva">
      <MinervaInner />
    </SessionProvider>
  );
};

export default Minerva;
