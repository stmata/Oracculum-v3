import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { ThemeProvider } from "./context/ThemeContext";
import { SessionProvider } from "./context/SessionContext";
import { AppProvider } from "./context/AppContext";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <AppProvider>
        <SessionProvider>
          <App />
        </SessionProvider>
      </AppProvider>
    </ThemeProvider>
  </StrictMode>
);
