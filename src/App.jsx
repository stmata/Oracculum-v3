import React, { useContext, useEffect } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeContext } from "./context/ThemeContext";
import { AppProvider } from "./context/AppContext";
import { DARK_THEME, LIGHT_THEME } from "./constants/themeConstants";
import ProtectedRoutes from "./routes/ProtectedRoute";
import "./App.scss";
import { UploadHistoryProvider } from "./context/UploadHistoryContext";
import { CandidatesDataProvider } from "./context/CandidatesDataContext";
import { VacatairesDatasProvider } from "./context/VacatairesDatasContext";

function App() {
  const { theme, toggleTheme } = useContext(ThemeContext);
  useEffect(() => {
    if (theme === DARK_THEME) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }
  }, [theme]);

  return (
    <AppProvider>
      <CandidatesDataProvider>
        <UploadHistoryProvider>
          <VacatairesDatasProvider>
            <Router>
              <Routes>
                <Route path="/*" element={<ProtectedRoutes />} />
              </Routes>
            </Router> </VacatairesDatasProvider>
        </UploadHistoryProvider>
      </CandidatesDataProvider>
    </AppProvider>
  );
}

export default App;
