import React from "react";
import { useSession } from "../../../../../context/SessionContext";
import DocumentResult from "../DocumentResult/DocumentResult";

const ResultCard = ({ data }) => {
  const { docType } = useSession();

  if (!docType) return null;

  return (
    <div>
      <DocumentResult data={data} />
    </div>
  );
};

export default ResultCard;
