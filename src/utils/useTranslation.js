import translations from "../constants/translations";
import { useAppContext } from "../context/AppContext";

export const useTranslation = () => {
  const { lang } = useAppContext();
  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;
  return { t };
};

export const TT = (t, key, fr, en, langGuess = "en") =>
  (typeof t === "function" && t(key)) || ((langGuess === "fr") ? fr : en);