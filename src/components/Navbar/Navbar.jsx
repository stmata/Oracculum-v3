import React, { useState, useEffect, useRef } from "react";
import styles from "./Navbar.module.css";
import { useNavigate } from "react-router-dom";
import logoLight from "../../assets/images/Logo-SKEMA-Couleur.png";
import logoDark from "../../assets/images/Logo-SKEMA-Blanc.png";
import { useAppContext } from "../../context/AppContext";
import { useTranslation } from "../../utils/useTranslation";
import { MdLightMode } from "react-icons/md";
import { IoLanguage } from "react-icons/io5";
import { TbLogout } from "react-icons/tb";
import { useSession } from "../../context/SessionContext";
import localforage from "localforage";

const Navbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [showLangModal, setShowLangModal] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [initials, setInitials] = useState("");
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const { lang, setLang, theme, setTheme, setUser } = useAppContext();
  const { resetSession } = useSession();
  const { t } = useTranslation();
  const logo = theme === "dark" ? logoDark : logoLight;

  useEffect(() => {
    const storedUserRaw =
      sessionStorage.getItem("user") || localStorage.getItem("user");

    const storedUser = storedUserRaw ? JSON.parse(storedUserRaw) : null;
    const storedEmail =
      storedUser?.email || localStorage.getItem("userEmail") || "";

    if (!storedEmail) {
      navigate("/", { replace: true });
      return;
    }

    const [first, last] = storedEmail.split("@")[0].split(".");
    const initialsValue = `${(first?.[0] || "").toUpperCase()}${(
      last?.[0] || ""
    ).toUpperCase()}`;
    setInitials(initialsValue);
  }, [navigate]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => setDropdownOpen((prev) => !prev);

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userEmail");
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    setUser(null);

    resetSession();
    try {
      const SESSION_PREFIX = "oraculum_session_";

      for (let i = localStorage.length - 1; i >= 0; i--) {
        const key = localStorage.key(i);
        if (key && key.startsWith(SESSION_PREFIX)) {
          localStorage.removeItem(key);
        }
      }
    } catch (e) {
      // silence
    }

    localforage.clear().catch(() => { });
    navigate("/", { replace: true });

  };

  return (
    <div className={styles.navbar}>
      <div className={styles.leftSection}>
        <img
          src={logo}
          alt="Logo"
          className={styles.logo}
          onClick={() => {
            const raw =
              sessionStorage.getItem("user") ||
              localStorage.getItem("user");
            if (raw) {
              try {
                const user = JSON.parse(raw);
                if (user) {
                  const updated = { ...user, first_use: false };
                  sessionStorage.setItem("user", JSON.stringify(updated));
                }
              } catch (e) {
                // ignore parse error
              }
            }
            navigate("/oraculum");
          }}
        />
        <div className={styles.titleBlock}>
          <span className={styles.title}>
            Oraculum<span className={styles.hr}>HR</span>
          </span>
          <span className={styles.subtitle}>{t("bySkema")}</span>
        </div>
      </div>

      <div
        className={styles.profile}
        ref={profileRef}
        onClick={toggleDropdown}
      >
        <div className={styles.initialsCircle}>{initials}</div>
        {dropdownOpen && (
          <div className={styles.dropdown}>
            <div
              className={styles.dropdownItem}
              onClick={() => setShowThemeModal(true)}
            >
              <MdLightMode className={styles.icon1} />
              <span>{t("theme")}</span>
            </div>
            <div
              className={styles.dropdownItem}
              onClick={() => setShowLangModal(true)}
            >
              <IoLanguage className={styles.icon} />
              <span>{t("language")}</span>
            </div>
            <div className={styles.dropdownItem} onClick={handleLogout}>
              <TbLogout className={styles.icon} />
              <span>{t("logout")}</span>
            </div>
          </div>
        )}
      </div>

      {showLangModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowLangModal(false)}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>{t("select_language")}</h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowLangModal(false)}
            >
              ×
            </button>

            <div className={styles.optionsGrid}>
              <div
                className={`${styles.optionCard} ${lang === "en" ? styles.selected : ""
                  }`}
                onClick={() => setLang("en")}
              >
                <span className={styles.flag}>🇬🇧</span>
                <span className={styles.label}>English</span>
              </div>
              <div
                className={`${styles.optionCard} ${lang === "fr" ? styles.selected : ""
                  }`}
                onClick={() => setLang("fr")}
              >
                <span className={styles.flag}>🇫🇷</span>
                <span className={styles.label}>Français</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {showThemeModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setShowThemeModal(false)}
        >
          <div
            className={styles.modalBox}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>{t("select_theme")}</h3>
            <button
              className={styles.closeButton}
              onClick={() => setShowThemeModal(false)}
            >
              ×
            </button>
            <div className={styles.optionsGrid}>
              <div
                className={`${styles.optionCard} ${theme === "light" ? styles.selected : ""
                  }`}
                onClick={() => setTheme("light")}
              >
                <span className={styles.flag}>🌖</span>
                <span className={styles.label}>{t("light")}</span>
              </div>
              <div
                className={`${styles.optionCard} ${theme === "dark" ? styles.selected : ""
                  }`}
                onClick={() => setTheme("dark")}
              >
                <span className={styles.flag}>🌑</span>
                <span className={styles.label}>{t("dark")}</span>
              </div>

              <div
                className={`${styles.optionCard} ${theme.startsWith("system") ? styles.selected : ""
                  }`}
                onClick={() => {
                  const prefersDark = window.matchMedia(
                    "(prefers-color-scheme: dark)"
                  ).matches;
                  setTheme(prefersDark ? "system-dark" : "system-light");
                }}
              >
                <span className={styles.flag}>⚙️</span>
                <span className={styles.label}>{t("system")}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Navbar;
