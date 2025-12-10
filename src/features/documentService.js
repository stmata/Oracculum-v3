

const PARSE_ENDPOINT = "/parse-document/";
import { postFormData } from "../services/api";

export const extractDocuments = async (docType, files) => {
  if (!docType) {
    throw new Error("Il faut préciser le type de document (idcard, passport, bank, resume ou diploma).");
  }

  if (!files || files.length === 0) {
    throw new Error("Aucun fichier n’a été fourni.");
  }

  const formData = new FormData();
  formData.append("doc_type", docType);

  for (let file of files) {
    formData.append("files", file); 
  }

  return await postFormData(PARSE_ENDPOINT, formData);
};
