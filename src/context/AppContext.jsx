import React, {
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("lang") || "fr";
    } catch {
      return "fr";
    }
  });

  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("themeMode") || "light";
    } catch {
      return "light";
    }
  });

  const [user, setUser] = useState(() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let finalTheme = theme;

    if (theme.startsWith("system")) {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      finalTheme = isDark ? "dark" : "light";
    }

    document.body.classList.remove("light-mode", "dark-mode");
    document.body.classList.add(`${finalTheme}-mode`);

    try {
      localStorage.setItem("themeMode", theme);
    } catch {}
  }, [theme]);

  useEffect(() => {
    try {
      localStorage.setItem("lang", lang);
    } catch {}
  }, [lang]);

  const value = {
    user,
    setUser,
    lang,
    setLang,
    theme,
    setTheme,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useAppContext = () => {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return ctx;
};
