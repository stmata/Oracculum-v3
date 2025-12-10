import React, { useContext, useEffect, useRef, useState } from "react";
import { ThemeContext } from "../../../../../context/ThemeContext";
import { useSession } from "../../../../../context/SessionContext";
import { useTranslation } from "../../../../../utils/useTranslation";
import { countryData } from "../../../../../constants/countryFlags";
import idStyles from "./IDCardResult.module.css";
import passportStyles from "./PassportResult.module.css";
import diplomaStyles from "./DiplomaResult.module.css";
import bankStyles from "./BankResult.module.css";
import resumeStyles from "./ResumeResult.module.css";
import { BsThreeDotsVertical } from "react-icons/bs";
import socialStyles from "./SocialSecurityResult.module.css";

const isManualData = (data) => {
  if (!data) return false;
  return Object.values(data).some(
    (val) =>
      typeof val === "string" &&
      val.toLowerCase().includes("please enter manually")
  );
};

const withFallbackFactory = (t) => (value) => {
  const raw = value?.toString().trim().toLowerCase();
  if (!raw || raw === "not provided" || raw === "non fourni") {
    return t("notProvided");
  }
  if (raw === "please enter manually") return t("plsmanually");
  return value;
};

const getCountryInfoByNationality = (nationality) => {
  const lower = nationality?.toLowerCase();
  if (!lower) return null;
  return countryData.find(
    (c) =>
      c.name.toLowerCase() === lower ||
      c.isoAlpha3?.toLowerCase() === lower ||
      (Array.isArray(c.aliases) &&
        c.aliases.some((alias) => alias.toLowerCase() === lower))
  );
};

const getCountryInfoByCode = (code) => {
  if (!code) return null;
  const lower = code.toLowerCase();
  return (
    countryData.find((c) => c.isoAlpha2?.toLowerCase() === lower) || null
  );
};

const useAutosizeTextArea = (text, textAreaRef, enabled = true) => {
  useEffect(() => {
    if (!enabled) return;
    if (textAreaRef.current) {
      const textArea = textAreaRef.current;
      textArea.style.height = "auto";
      requestAnimationFrame(() => {
        textArea.style.height = textArea.scrollHeight + "px";
      });
    }
  }, [text, textAreaRef, enabled]);
};

const DOC_CONFIG = {
  idcard: {
    styles: idStyles,
    getSafeId: (data) => data.document_number,
    getMissingChecks: (source) => [
      source.nationality,
      source.firstname,
      source.lastname,
      source.document_number,
      source.address,
      source.expiration_date,
      source.date_of_birth,
      source.place_of_birth,
    ],
    autoSelectRules: ({ filterMode, searchTerm, selectedCountry, data }) => {
      if (isManualData(data)) return false;

      const nationality = data.nationality?.toLowerCase();
      switch (filterMode) {
        case "All":
          return true;
        case "Search": {
          const term = searchTerm?.trim().toLowerCase();
          if (!term) return false;
          return Object.values(data).some(
            (val) =>
              typeof val === "string" && val.toLowerCase().includes(term)
          );
        }
        case "Country": {
          const selected = selectedCountry?.toLowerCase();
          const match = selected === "anywhere" || nationality === selected;
          return !!match;
        }
        default:
          return false;
      }
    },
    renderContent: ({
      styles,
      data,
      formData,
      editMode,
      handleChange,
      withFallback,
      isDark,
      t,
      toggleFile,
    }) => {
      const {
        nationality,
        firstname,
        lastname,
        document_number,
        address,
        expiration_date,
        date_of_birth,
        place_of_birth,
      } = data;

      const countryInfo = getCountryInfoByNationality(nationality) || {
        name: nationality,
        flag: "🏳️",
      };

      return (
        <div className={styles.contentRow}>
          <div className={styles.left}>
            <div className={styles.flag}>{countryInfo.flag}</div>
            <div className={styles.country}>
              {editMode ? (
                <>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("country")} :
                  </div>
                  <div
                    className={`${styles.editInputPays} ${isDark ? styles.darkEditInputPays : ""
                      }`}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={(e) =>
                      handleChange("nationality")({
                        target: { value: e.target.innerText },
                      })
                    }
                    dangerouslySetInnerHTML={{
                      __html: formData.nationality || "",
                    }}
                  />
                </>
              ) : (
                withFallback(countryInfo.name || nationality)
              )}
            </div>
          </div>

          <div className={styles.middle}>
            <div className={styles.nameRow}>
              <div className={styles.name}>
                {editMode ? (
                  <>
                    <div className={styles.nameRow}>
                      <div className={styles.inputGroup}>
                        <div
                          className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                            }`}
                        >
                          {t("firstname")} :
                        </div>
                        <input
                          value={formData.firstname}
                          onChange={handleChange("firstname")}
                          className={`${styles.editInputFN} ${isDark ? styles.darkeditInputFN : ""
                            }`}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <div
                          className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                            }`}
                        >
                          {t("surname")} :
                        </div>
                        <input
                          value={formData.lastname}
                          onChange={handleChange("lastname")}
                          className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                            }`}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  `${withFallback(firstname)} — ${withFallback(lastname)}`
                )}

                <span
                  className={`${styles.idNumberWrapper} ${isDark ? styles.darkidNumberWrapper : ""
                    }`}
                >
                  {editMode ? (
                    <div className={styles.inputGroup}>
                      <div
                        className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                          }`}
                      >
                        {t("id_number")} :
                      </div>
                      <input
                        value={formData.document_number}
                        onChange={handleChange("document_number")}
                        className={`${styles.idNumberInput} ${isDark ? styles.darkIdNumber : ""
                          }`}
                      />
                    </div>
                  ) : (
                    <span
                      className={`${styles.idNumber} ${isDark ? styles.darkIdNumber : ""
                        }`}
                    >
                      {withFallback(document_number)}
                    </span>
                  )}
                </span>
              </div>
            </div>

            <div className={styles.meta}>
              {editMode ? (
                <>
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("place_of_birth")} :
                    </div>
                    <input
                      value={formData.place_of_birth}
                      onChange={handleChange("place_of_birth")}
                      className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                        }`}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("date_of_birth")} :
                    </div>
                    <input
                      value={formData.date_of_birth}
                      onChange={handleChange("date_of_birth")}
                      className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                        }`}
                    />
                  </div>
                </>
              ) : (
                `${withFallback(place_of_birth)} — ${withFallback(
                  date_of_birth
                )}`
              )}
            </div>
          </div>

          <div className={styles.right}>
            <div>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("expiry_date")} :
                  </div>
                  <input
                    value={formData.expiration_date}
                    onChange={handleChange("expiration_date")}
                    className={`${styles.editInputDate} ${isDark ? styles.darkeditInputDate : ""
                      }`}
                  />
                </div>
              ) : (
                withFallback(expiration_date?.split("-")[0])
              )}
            </div>
            <div>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("adress")} :
                  </div>
                  <textarea
                    value={formData.address}
                    onChange={handleChange("address")}
                    rows={5}
                    className={`${styles.editInputAdress} ${isDark ? styles.darkeditInputDate : ""
                      }`}
                  />
                </div>
              ) : (
                withFallback(address)
              )}
            </div>
            <button
              className={styles.moreBtn}
              onClick={(e) => {
                e.stopPropagation();
                toggleFile();
              }}
            >
              📄
            </button>
          </div>
        </div>
      );
    },
  },

  resume: {
    styles: resumeStyles,
    getSafeId: (data) =>
      isManualData(data)
        ? `manual-${data._sourceFileIndex}`
        : data.email || `resume-${data._sourceFileIndex}`,
    getMissingChecks: (source) => [
      source.firstname,
      source.lastname,
      source.address,
      source.phone,
      source.email,
      source.experience,
      source.education,
      source.skills,
      source.languages,
    ],
    autoSelectRules: ({ filterMode, searchTerm, selectedCountry, data }) => {
      if (isManualData(data)) return false;

      switch (filterMode) {
        case "All":
          return true;
        case "Search": {
          const term = searchTerm?.trim().toLowerCase();
          if (!term) return false;
          return Object.values(data).some(
            (val) => typeof val === "string" && val.toLowerCase().includes(term)
          );
        }
        case "Country": {
          const selected = selectedCountry?.toLowerCase();
          const itemCountry = "canada";
          const match = selected === "anywhere" || itemCountry === selected;
          return !!match;
        }
        default:
          return false;
      }
    },
    renderContent: ({
      styles,
      data,
      formData,
      editMode,
      handleChange,
      withFallback,
      isDark,
      t,
      toggleFile,
      showDetails,
      setShowDetails,
      skillsRef,
      experienceRef,
      educationRef,
      hasFile,
      hasWarning,
      hasManualWarning,
    }) => {
      const {
        firstname,
        lastname,
        address,
        phone,
        email,
        experience,
        education,
        skills,
        languages,
      } = data;

      const safeText = (v) => (withFallback(v) || "").toString();

      const experienceLines = safeText(experience)
        .split("\n")
        .filter((line) => line.trim());
      const firstExperience = experienceLines[0] || t("notProvided");
      const remainingExperience = experienceLines.slice(1);

      const langRaw = safeText(languages);
      const langList = langRaw
        .split(",")
        .map((l) => l.trim())
        .filter((l) => l);
      const displayedLangs = langList.slice(0, 3);
      const remainingLangs = langList.length > 3 ? langList.slice(3) : [];
      const remainingCount = langList.length > 3 ? langList.length - 3 : 0;

      return (
        <>
          <div className={styles.headerRow}>
            {hasWarning && (
              <div className={styles.customToastWarning}>
                <div className={styles.toastIcon}>⚠️</div>
                <div className={styles.toastText}>
                  {t("incompleteFieldsWarning")}
                </div>
              </div>
            )}

            {hasManualWarning && (
              <div className={styles.customToastError}>
                <div className={styles.toastIcon}>❗</div>
                <div className={styles.toastText}>
                  {t("manuallyFieldsWarning")}
                </div>
              </div>
            )}

            <div className={styles.topRightWrapper}>
              {hasFile && (
                <button
                  className={styles.moreBtn}
                  type="button"
                  title={t("seeFile") || "Voir le fichier"}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFile();
                  }}
                >
                  📄
                </button>
              )}
              <button
                className={styles.moreBtn}
                type="button"
                title={t("seeDetails") || "Voir les détails"}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDetails((prev) => !prev);
                }}
              >
                <BsThreeDotsVertical />
              </button>
            </div>
          </div>

          <div className={styles.cardContent}>
            <div className={styles.left}>
              <div className={styles.fullName}>
                {editMode ? (
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("firstname")} :
                    </div>
                    <input
                      className={`${styles.editInput} ${isDark ? styles.darkEditInput : ""
                        }`}
                      value={formData.firstname}
                      onChange={handleChange("firstname")}
                    />
                  </div>
                ) : (
                  withFallback(firstname)
                )}{" "}
                {editMode ? (
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("surname")} :
                    </div>
                    <input
                      className={`${styles.editInput} ${isDark ? styles.darkEditInput : ""
                        }`}
                      value={formData.lastname}
                      onChange={handleChange("lastname")}
                    />
                  </div>
                ) : (
                  withFallback(lastname)
                )}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.emoji}>✉️</span>
                {editMode ? (
                  <input
                    className={`${styles.editInputEmail} ${isDark ? styles.darkEditInputEmail : ""
                      }`}
                    value={formData.email}
                    onChange={handleChange("email")}
                  />
                ) : (
                  withFallback(email)
                )}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.emoji}>📞</span>
                {editMode ? (
                  <input
                    className={`${styles.editInputEmail} ${isDark ? styles.darkEditInputEmail : ""
                      }`}
                    value={formData.phone}
                    onChange={handleChange("phone")}
                  />
                ) : (
                  withFallback(phone)
                )}
              </div>

              <div className={styles.infoRow}>
                <span className={styles.emoji}>📍</span>
                {editMode ? (
                  <input
                    className={`${styles.editInputEmail} ${isDark ? styles.darkEditInputEmail : ""
                      }`}
                    value={formData.address}
                    onChange={handleChange("address")}
                  />
                ) : (
                  withFallback(address)
                )}
              </div>
            </div>

            <div className={styles.rightt}>
              <div className={styles.experience}>{safeText(firstExperience)}</div>

              <div className={styles.languages}>
                {displayedLangs.map((langItem, i) => (
                  <span
                    key={i}
                    className={`${styles.langBadge} ${isDark ? styles.darkLangBadge : ""
                      }`}
                  >
                    {langItem}
                  </span>
                ))}
                {remainingCount > 0 && (
                  <span
                    className={`${styles.langExtra} ${isDark ? styles.darkLangExtra : ""
                      }`}
                  >
                    +{remainingCount}
                  </span>
                )}
              </div>
            </div>
          </div>

          {showDetails && (
            <div
              className={`${styles.detailsBox} ${isDark ? styles.darkDetailsBox : ""
                }`}
            >
              <div className={styles.detailSection}>
                <div className={styles.detailTitleGreen}>
                  {t("skills") || "Skills"}
                </div>
                {editMode ? (
                  <textarea
                    ref={skillsRef}
                    className={`${styles.editInputSkills} ${isDark ? styles.darkeditInputSkills : ""
                      }`}
                    value={formData.skills}
                    onChange={handleChange("skills")}
                  />
                ) : (
                  <div
                    className={styles.details}
                    style={{ whiteSpace: "pre-wrap" }}
                  >
                    {withFallback(skills)}
                  </div>
                )}
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailTitleBlur}>
                  {t("experience") || "Experience"}
                </div>
                {editMode ? (
                  <textarea
                    ref={experienceRef}
                    className={`${styles.editInputSkills} ${isDark ? styles.darkeditInputSkills : ""
                      }`}
                    value={formData.experience}
                    onChange={handleChange("experience")}
                  />
                ) : (
                  <div className={styles.details}>
                    {remainingExperience.length > 0 ? (
                      remainingExperience.map((line, i) => (
                        <div key={i}>{line}</div>
                      ))
                    ) : (
                      <div>{t("notProvided")}</div>
                    )}
                  </div>
                )}
              </div>

              <div className={styles.detailSection}>
                <div className={styles.detailTitleEduc}>
                  {t("education") || "Education"}
                </div>
                {editMode ? (
                  <textarea
                    ref={educationRef}
                    className={`${styles.editInputSkills} ${isDark ? styles.darkeditInputSkills : ""
                      }`}
                    value={formData.education}
                    onChange={handleChange("education")}
                  />
                ) : (
                  <div className={styles.details}>
                    {withFallback(education)}
                  </div>
                )}
              </div>

              {(editMode || remainingLangs.length > 0) && (
                <div className={styles.detailSection}>
                  <div className={styles.detailTitleLang}>
                    {t("languages") || "Languages"}
                  </div>
                  {editMode ? (
                    <input
                      type="text"
                      className={`${styles.editInputSkills} ${isDark ? styles.darkeditInputSkills : ""
                        }`}
                      value={formData.languages}
                      onChange={handleChange("languages")}
                    />
                  ) : (
                    <div className={styles.details}>
                      {remainingLangs.join(", ")}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

        </>
      );
    },
  },

  passport: {
    styles: passportStyles,
    getSafeId: (data) =>
      isManualData(data)
        ? `manual-${data._sourceFileIndex}`
        : data.passport_number,
    getMissingChecks: (source) => [
      source.nationality,
      source.firstname,
      source.lastname,
      source.passport_number,
      source.date_of_birth,
      source.expiration_date,
      source.place_of_birth,
    ],
    autoSelectRules: ({ filterMode, searchTerm, selectedCountry, data }) => {
      if (isManualData(data)) return false;
      const nationality = data.nationality?.toLowerCase();

      switch (filterMode) {
        case "All":
          return true;
        case "Search": {
          const term = searchTerm?.trim().toLowerCase();
          if (!term) return false;
          return Object.values(data).some(
            (val) =>
              typeof val === "string" && val.toLowerCase().includes(term)
          );
        }
        case "Country": {
          const selected = selectedCountry?.toLowerCase();
          const match = selected === "anywhere" || nationality === selected;
          return !!match;
        }
        default:
          return false;
      }
    },
    renderContent: ({
      styles,
      data,
      formData,
      editMode,
      handleChange,
      withFallback,
      isDark,
      t,
      toggleFile,
    }) => {
      const {
        nationality,
        firstname,
        lastname,
        passport_number,
        date_of_birth,
        expiration_date,
        place_of_birth,
      } = data;

      const countryInfo = getCountryInfoByNationality(nationality) || {
        name: nationality,
        flag: "🏳️",
      };

      return (
        <div className={styles.contentRow}>
          <div className={styles.left}>
            <div className={styles.flag}>{countryInfo?.flag || "🏳️"}</div>
            <div className={styles.country}>
              {editMode ? (
                <>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("country")} :
                  </div>

                  <input
                    value={formData.nationality}
                    onChange={handleChange("nationality")}
                    className={`${styles.editInputPays} ${isDark ? styles.darkEditInputPays : ""
                      }`}
                  />
                </>
              ) : (
                withFallback(countryInfo?.name || nationality)
              )}
            </div>
          </div>

          <div className={styles.middle}>
            <div className={styles.nameRow}>
              <div className={styles.name}>
                {editMode ? (
                  <>
                    <div className={styles.nameRow}>
                      <div className={styles.inputGroup}>
                        <div
                          className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                            }`}
                        >
                          {t("firstname")} :
                        </div>
                        <input
                          value={formData.firstname}
                          onChange={handleChange("firstname")}
                          className={`${styles.editInputFN} ${isDark ? styles.darkeditInputFN : ""
                            }`}
                        />
                      </div>

                      <div className={styles.inputGroup}>
                        <div
                          className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                            }`}
                        >
                          {t("surname")} :
                        </div>
                        <input
                          value={formData.lastname}
                          onChange={handleChange("lastname")}
                          className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                            }`}
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  `${withFallback(firstname)} — ${withFallback(lastname)}`
                )}

                {editMode ? (
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("id_number")} :
                    </div>
                    <div className={styles.idNumber}>
                      <input
                        value={formData.passport_number}
                        onChange={handleChange("passport_number")}
                        className={`${styles.idNumberInput} ${isDark ? styles.darkIdNumber : ""
                          }`}
                      />
                    </div>
                  </div>
                ) : (
                  <span
                    className={`${styles.idNumber} ${isDark ? styles.darkIdNumber : ""
                      }`}
                  >
                    {withFallback(passport_number)}
                  </span>
                )}
              </div>
            </div>

            <div className={styles.meta}>
              {editMode ? (
                <>
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("place_of_birth")} :
                    </div>
                    <input
                      value={formData.place_of_birth}
                      onChange={handleChange("place_of_birth")}
                      className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                        }`}
                    />
                  </div>

                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("date_of_birth")} :
                    </div>
                    <input
                      value={formData.date_of_birth}
                      onChange={handleChange("date_of_birth")}
                      className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                        }`}
                    />
                  </div>
                </>
              ) : (
                `${withFallback(place_of_birth)} — ${withFallback(
                  date_of_birth
                )}`
              )}
            </div>
          </div>

          <div className={styles.right}>
            <div>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("expiry_date")} :
                  </div>
                  <input
                    value={formData.expiration_date}
                    onChange={handleChange("expiration_date")}
                    className={`${styles.editInputDate} ${isDark ? styles.darkeditInputDate : ""
                      }`}
                  />
                </div>
              ) : (
                withFallback(expiration_date)
              )}
            </div>
            <button
              className={styles.moreBtn}
              onClick={(e) => {
                e.stopPropagation();
                toggleFile();
              }}
            >
              📄
            </button>
          </div>
        </div>
      );
    },
  },

  diploma: {
    styles: diplomaStyles,
    getSafeId: (data) =>
      isManualData(data)
        ? `manual-${data._sourceFileIndex}`
        : `${data.fullname || "unknown"}__${data.institution || "unk"}_${data.field_of_study || "unk"
        }_${data.degree || "unk"}`,
    getMissingChecks: (source) => {
      const keys = [
        "fullname",
        "institution",
        "field_of_study",
        "degree",
        "graduation_date",
        "diploma_number",
      ];
      return keys.map((k) => source[k]);
    },
    autoSelectRules: ({ filterMode, searchTerm, data }) => {
      if (isManualData(data)) return false;
      switch (filterMode) {
        case "All":
          return true;
        case "Search": {
          const term = searchTerm?.trim().toLowerCase();
          if (!term) return false;
          return Object.values(data).some(
            (val) =>
              typeof val === "string" && val.toLowerCase().includes(term)
          );
        }
        default:
          return false;
      }
    },
    renderContent: ({
      styles,
      data,
      formData,
      editMode,
      handleChange,
      withFallback,
      isDark,
      t,
      toggleFile,
      sourceFile,
    }) => {
      return (
        <div className={styles.contentRow}>
          <div className={styles.middle}>
            <div className={styles.nameRow}>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("name")} :
                  </div>
                  <input
                    type="text"
                    className={`${styles.editInputFN} ${isDark ? styles.darkeditInputFN : ""
                      }`}
                    value={formData.fullname}
                    onChange={handleChange("fullname")}
                  />
                </div>
              ) : (
                <div className={styles.name}>
                  {withFallback(data.fullname)}
                </div>
              )}
            </div>
            <div className={styles.meta}>
              {editMode ? (
                <>
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("degree")} :
                    </div>
                    <input
                      type="text"
                      className={`${styles.editInputMeta} ${isDark ? styles.darkeditInputMeta : ""
                        }`}
                      value={formData.degree}
                      onChange={handleChange("degree")}
                    />
                  </div>
                  <div className={styles.inputGroup}>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      {t("major")} :
                    </div>
                    <input
                      type="text"
                      className={`${styles.editInputMeta} ${isDark ? styles.darkeditInputMeta : ""
                        }`}
                      value={formData.field_of_study}
                      onChange={handleChange("field_of_study")}
                    />
                  </div>
                </>
              ) : (
                `${withFallback(data.degree)} — ${withFallback(
                  data.field_of_study
                )}`
              )}
            </div>
            <div className={styles.meta}>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("university")} :
                  </div>
                  <input
                    type="text"
                    className={`${styles.editInputFN} ${isDark ? styles.darkeditInputFN : ""
                      }`}
                    value={formData.institution}
                    onChange={handleChange("institution")}
                  />
                </div>
              ) : (
                withFallback(data.institution)
              )}
            </div>
          </div>

          <div className={styles.right}>
            <div>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("date_obtention")} :
                  </div>
                  <input
                    type="text"
                    className={`${styles.editInputDate} ${isDark ? styles.darkEditInputDate : ""
                      }`}
                    value={formData.graduation_date}
                    onChange={handleChange("graduation_date")}
                  />
                </div>
              ) : (
                withFallback(data.graduation_date)
              )}
            </div>
            <div>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("diploma_number")} :
                  </div>
                  <input
                    type="text"
                    className={`${styles.editInputLang} ${isDark ? styles.darkEditInputLang : ""
                      }`}
                    value={formData.diploma_number}
                    onChange={handleChange("diploma_number")}
                  />
                </div>
              ) : (
                withFallback(data.diploma_number)
              )}
            </div>

            {sourceFile && (
              <button
                className={styles.moreBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFile();
                }}
              >
                📄
              </button>
            )}
          </div>
        </div>
      );
    },
  },

  bank: {
    styles: bankStyles,
    getSafeId: (data) => {
      const cleanIban = (data.code_iban || "").replace(/\s+/g, "");
      const cleanBic = (data.code_bic || "").replace(/\s+/g, "");
      return isManualData(data)
        ? `manual-${data._sourceFileIndex}`
        : `${cleanIban}${cleanBic}` || `${data._sourceFileIndex}`;
    },
    getMissingChecks: (source) => [
      source.libellé_du_compte,
      source.code_pays,
      source.code_iban,
      source.code_bic,
      source.nom_banque,
      source.guichet_banque,
    ],
    autoSelectRules: ({ filterMode, searchTerm, selectedCountry, data }) => {
      if (isManualData(data)) return false;
      const code_pays = data.code_pays?.toLowerCase();

      switch (filterMode) {
        case "All":
          return true;
        case "Search": {
          const term = searchTerm?.trim().toLowerCase();
          if (!term) return false;
          return Object.values(data).some(
            (val) =>
              typeof val === "string" && val.toLowerCase().includes(term)
          );
        }
        case "Country": {
          const selected = selectedCountry?.toLowerCase();
          const match = selected === "anywhere" || code_pays === selected;
          return !!match;
        }
        default:
          return false;
      }
    },
    renderContent: ({
      styles,
      data,
      formData,
      editMode,
      handleChange,
      withFallback,
      isDark,
      t,
      toggleFile,
      sourceFile,
    }) => {
      const {
        libellé_du_compte,
        code_pays,
        code_iban,
        code_bic,
        nom_banque,
        guichet_banque,
      } = data;

      const countryInfo =
        getCountryInfoByCode(code_pays) || {
          name: code_pays || "Unknown",
          flag: "🏳️",
        };

      return (
        <div className={styles.contentRow}>
          <div className={styles.left}>
            <div className={styles.flag}>{countryInfo.flag}</div>
            {editMode ? (
              <>
                <div
                  className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                    }`}
                >
                  {t("country")} :
                </div>
                <input
                  type="text"
                  className={`${styles.editInputPays} ${isDark ? styles.darkEditInputPays : ""
                    }`}
                  value={formData.code_pays}
                  onChange={handleChange("code_pays")}
                />
              </>
            ) : (
              <div className={styles.country}>
                {withFallback(countryInfo.name)}
              </div>
            )}
          </div>

          <div className={styles.middle}>
            <div className={styles.nameRow}>
              {editMode ? (
                <>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("name")} :
                  </div>
                  <input
                    type="text"
                    className={`${styles.editInputFN} ${isDark ? styles.darkeditInputFN : ""
                      }`}
                    value={formData.libellé_du_compte}
                    onChange={handleChange("libellé_du_compte")}
                  />
                </>
              ) : (
                <div className={styles.name}>
                  {withFallback(libellé_du_compte)}
                </div>
              )}

              <div className={styles.value}>
                {editMode ? (
                  <>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      IBAN :
                    </div>
                    <input
                      type="text"
                      className={`${styles.editInputFN} ${isDark ? styles.darkeditInputMeta : ""
                        }`}
                      value={formData.code_iban}
                      onChange={handleChange("code_iban")}
                    />
                  </>
                ) : (
                  <span className={styles.iban}>
                    {withFallback(code_iban)}
                  </span>
                )}
              </div>

              <div className={styles.value}>
                {editMode ? (
                  <>
                    <div
                      className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                        }`}
                    >
                      BIC :
                    </div>
                    <input
                      type="text"
                      className={`${styles.editInputFN} ${isDark ? styles.darkeditInputMeta : ""
                        }`}
                      value={formData.code_bic}
                      onChange={handleChange("code_bic")}
                    />
                  </>
                ) : (
                  <span className={styles.iban}>
                    {withFallback(code_bic)}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={styles.right}>
            <div className={styles.meta}>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("bankName")} :
                  </div>
                  <input
                    type="text"
                    className={`${styles.editInputGuichet} ${isDark ? styles.darkEditInputGuichet : ""
                      }`}
                    value={formData.nom_banque}
                    onChange={handleChange("nom_banque")}
                  />
                </div>
              ) : (
                withFallback(nom_banque)
              )}
            </div>

            <div className={styles.meta}>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("bankBranch")} :
                  </div>
                  <textarea
                    className={`${styles.editInputGuichet} ${isDark ? styles.darkEditInputGuichet : ""
                      }`}
                    value={formData.guichet_banque}
                    onChange={handleChange("guichet_banque")}
                    rows={5}
                  />
                </div>
              ) : (
                withFallback(guichet_banque)
              )}
            </div>

            {sourceFile && (
              <button
                className={styles.moreBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFile();
                }}
              >
                📄
              </button>
            )}
          </div>
        </div>
      );
    },
  },

  social_security: {
    styles: socialStyles,
    getSafeId: (data) =>
      isManualData(data)
        ? `manual-${data._sourceFileIndex}`
        : data.social_security_number,
    getMissingChecks: (source) => [
      source.fullname,
      source.social_security_number,
      source.issuing_country,
      source.issuing_date,
      source.expiration_date,
    ],
    autoSelectRules: ({ filterMode, searchTerm, selectedCountry, data }) => {
      if (isManualData(data)) return false;

      const issuingCountry = data.issuing_country?.toLowerCase();

      switch (filterMode) {
        case "All":
          return true;

        case "Search": {
          const term = searchTerm?.trim().toLowerCase();
          if (!term) return false;
          return Object.values(data).some(
            (val) =>
              typeof val === "string" && val.toLowerCase().includes(term)
          );
        }

        case "Country": {
          const selected = selectedCountry?.toLowerCase();
          const match = selected === "anywhere" || issuingCountry === selected;
          return !!match;
        }

        default:
          return false;
      }
    },
    renderContent: ({
      styles,
      data,
      formData,
      editMode,
      handleChange,
      withFallback,
      isDark,
      t,
      toggleFile,
      sourceFile,
    }) => {
      const {
        fullname,
        social_security_number,
        issuing_country,
        issuing_date,
        expiration_date,
      } = data;

      const countryInfo =
        getCountryInfoByNationality(issuing_country) || {
          name: issuing_country,
          flag: "🏳️",
        };

      return (
        <div className={styles.contentRow}>
          <div className={styles.left}>
            <div className={styles.flag}>{countryInfo?.flag || "🏳️"}</div>
            <div className={styles.country}>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("country")} :
                  </div>
                  <input
                    value={formData.issuing_country}
                    onChange={handleChange("issuing_country")}
                    className={`${styles.editInputPays} ${isDark ? styles.darkEditInputPays : ""
                      }`}
                  />
                </div>
              ) : (
                withFallback(countryInfo?.name || issuing_country)
              )}
            </div>
          </div>

          <div className={styles.middle}>
            {editMode ? (
              <div className={styles.nameRow}>
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("fullname")} :
                  </div>
                  <input
                    value={formData.fullname}
                    onChange={handleChange("fullname")}
                    className={`${styles.editInputFN} ${isDark ? styles.darkeditInputFN : ""
                      }`}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("ss_number")} :
                  </div>
                  <input
                    value={formData.social_security_number}
                    onChange={handleChange("social_security_number")}
                    className={`${styles.idNumberInput} ${isDark ? styles.darkIdNumber : ""
                      }`}
                  />
                </div>
              </div>
            ) : (
              <div className={styles.nameRow}>
                <span className={styles.name}>
                  {withFallback(fullname)}
                </span>
                <span
                  className={`${styles.idNumber} ${isDark ? styles.darkIdNumber : ""
                    }`}
                >
                  {withFallback(social_security_number)}
                </span>
              </div>
            )}

            <div className={styles.meta}>
              {editMode ? (
                <div className={styles.inputGroup}>
                  <div
                    className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                      }`}
                  >
                    {t("issuing_date")} :
                  </div>
                  <input
                    value={formData.issuing_date}
                    onChange={handleChange("issuing_date")}
                    className={`${styles.editInputLN} ${isDark ? styles.darkeditInputLN : ""
                      }`}
                  />
                </div>
              ) : (
                <div>{withFallback(issuing_date)}</div>
              )}
            </div>
          </div>

          <div className={styles.right}>
            {editMode ? (
              <div className={styles.inputGroup}>
                <div
                  className={`${styles.editLabel} ${isDark ? styles.darkeditLabel : ""
                    }`}
                >
                  {t("expiry_date")} :
                </div>
                <input
                  value={formData.expiration_date}
                  onChange={handleChange("expiration_date")}
                  className={`${styles.editInputDate} ${isDark ? styles.darkeditInputDate : ""
                    }`}
                />
              </div>
            ) : (
              withFallback(expiration_date)
            )}

            {sourceFile && (
              <button
                className={styles.moreBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFile();
                }}
              >
                📄
              </button>
            )}
          </div>
        </div>
      );
    },
  },
};

const DocumentResult = ({ data }) => {
  const {
    docType,
    selectedCards,
    setSelectedCards,
    filterMode,
    searchTerm,
    selectedCountry,
    setDetectedCountries,
    uploadedFiles,
    uploadedFileInfos,
    setExtractedData,
    openFilePreviews,
    setOpenFilePreviews,
  } = useSession();

  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";
  const { t } = useTranslation();
  const withFallback = withFallbackFactory(t);

  const config = DOC_CONFIG[docType] || null;
  const styles = config?.styles || {};

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState(() => ({ ...data }));
  const [showDetails, setShowDetails] = useState(false);

  const sourceIndex = data._sourceFileIndex ?? -1;

  let sourceFile = null;
  if (Array.isArray(uploadedFiles) && uploadedFiles.length > 0) {
    if (
      typeof sourceIndex === "number" &&
      sourceIndex >= 0 &&
      sourceIndex < uploadedFiles.length
    ) {
      sourceFile = uploadedFiles[sourceIndex];
    }
    if (!sourceFile && data.filename) {
      sourceFile =
        uploadedFiles.find((f) => f.name === data.filename) || null;
    }
  }
  const backendFileUrl = data.file_url || data.source_file_url || null;
  const [objectUrl, setObjectUrl] = useState(null);
  const fileUrl = objectUrl || backendFileUrl;
  const hasFile = !!sourceFile || !!backendFileUrl;
  const manual = isManualData(data);
  const safeId = config ? config.getSafeId(data) : null;
  const previewKey = safeId ?? sourceIndex;
  const [showFile, setShowFile] = useState(
    () => hasFile && openFilePreviews?.includes(previewKey)
  );

  useEffect(() => {
    if (!hasFile) {
      if (showFile) {
        setShowFile(false);
      }

      setOpenFilePreviews((prevRaw = []) => {
        const prev = Array.isArray(prevRaw) ? prevRaw : [];
        if (!prev.includes(previewKey)) {
          return prev;
        }
        return prev.filter((k) => k !== previewKey);
      });

      return;
    }

    if (!openFilePreviews) return;

    const shouldBeOpen = openFilePreviews.includes(previewKey);
    if (shouldBeOpen !== showFile) {
      setShowFile(shouldBeOpen);
    }
  }, [hasFile, openFilePreviews, previewKey, showFile, setOpenFilePreviews]);

  useEffect(() => {
    if (!sourceFile) {
      setObjectUrl(null);
      return;
    }
    const url = URL.createObjectURL(sourceFile);
    setObjectUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [sourceFile]);

  const toggleFile = () => {
    setShowFile((prev) => !prev);

    setOpenFilePreviews((prevRaw = []) => {
      const prev = Array.isArray(prevRaw) ? prevRaw : [];
      const exists = prev.includes(previewKey);
      if (exists) {
        return prev.filter((k) => k !== previewKey);
      }
      return [...prev, previewKey];
    });
  };

  const isSelected = !!safeId && selectedCards.includes(safeId);

  const skillsRef = useRef(null);
  const experienceRef = useRef(null);
  const educationRef = useRef(null);

  useAutosizeTextArea(
    formData.skills,
    skillsRef,
    docType === "resume" && (editMode || showDetails)
  );
  useAutosizeTextArea(
    formData.experience,
    experienceRef,
    docType === "resume" && (editMode || showDetails)
  );
  useAutosizeTextArea(
    formData.education,
    educationRef,
    docType === "resume" && (editMode || showDetails)
  );

  useEffect(() => {
    if (!editMode) {
      setFormData({ ...data });
    }
  }, [data, editMode]);

  useEffect(() => {
    if (!config) return;

    const shouldSelect = config.autoSelectRules({
      filterMode,
      searchTerm,
      selectedCountry,
      data,
    });

    if (shouldSelect && safeId && !selectedCards.includes(safeId)) {
      setSelectedCards((prevRaw = []) => {
        const prev = Array.isArray(prevRaw) ? prevRaw : [];
        if (prev.includes(safeId)) return prev;
        return [...prev, safeId];
      });
    }
  }, [
    filterMode,
    searchTerm,
    selectedCountry,
    data,
    safeId,
    selectedCards,
    setSelectedCards,
    config,
  ]);

  const handleChange = (key) => (e) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    const id = formData._sourceFileIndex;
    setExtractedData((prevRaw = []) => {
      const prev = Array.isArray(prevRaw) ? prevRaw : [];
      return prev.map((d) =>
        d._sourceFileIndex === id ? { ...formData } : d
      );
    });
    setEditMode(false);
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(data);
  };

  const toggleSelect = () => {
    if (!config) return;
    if (!safeId || manual) return;

    const already = selectedCards.includes(safeId);

    switch (filterMode) {
      case "Manually":
        setSelectedCards((prevRaw = []) => {
          const prev = Array.isArray(prevRaw) ? prevRaw : [];
          if (already) {
            return prev.filter((x) => x !== safeId);
          }
          return [...new Set([...prev, safeId])];
        });
        break;
      case "All":
        if (!already) {
          setSelectedCards((prevRaw = []) => {
            const prev = Array.isArray(prevRaw) ? prevRaw : [];
            if (prev.includes(safeId)) return prev;
            return [...prev, safeId];
          });
        }
        break;
      case "Search":
      case "Country":
      default:
        break;
    }
  };

  const handleDoubleClick = () => {
    setEditMode(true);
    setFormData((prev) => ({ ...prev }));
    if (docType === "resume") {
      setShowDetails(true);
    }
  };

  const isFieldMissing = () => {
    if (!config) return false;
    const source = editMode ? formData : data;
    const checks = config.getMissingChecks(source);
    return checks.some((val) => {
      if (!val) return true;
      const raw = val.toString().trim().toLowerCase();
      return raw === "" || raw === "not provided" || raw === "double check";
    });
  };

  const hasManualWarning = manual;
  const hasWarning = !manual && isFieldMissing();

  if (!config) {
    return null;
  }

  const baseWrapper = styles.cardWrapper || styles.resultWrapper || "";
  const wrapperClass = [
    baseWrapper,
    showFile && styles.hasFile ? styles.hasFile : "",
  ]
    .filter(Boolean)
    .join(" ");

  const cardBaseClass =
    styles.card || styles.cardContainer || styles.resultCard || "";

  const cardClassName = [
    cardBaseClass,
    isDark ? styles.darkCard : "",
    isSelected ? styles.selected : "",
    docType === "resume" && showDetails ? styles.cardOpen : "",
    docType === "resume" && !showDetails ? styles.cardClosed : "",
  ]
    .filter(Boolean)
    .join(" ");

  const filePreviewClass = sourceFile
    ? sourceFile.type.includes("image")
      ? `${styles.filePreview || ""} ${styles.imagePreview ? styles.imagePreview : ""
        }`.trim()
      : styles.filePreview || ""
    : styles.filePreview || "";

  return (
    <div className={wrapperClass}>
      <div
        className={cardClassName}
        tabIndex={0}
        onClick={() => !editMode && toggleSelect()}
        onDoubleClick={handleDoubleClick}
      >
        {docType !== "resume" && hasWarning && (
          <div className={styles.customToastWarning}>
            <div className={styles.toastIcon}>⚠️</div>
            <div className={styles.toastText}>
              {t("incompleteFieldsWarning")}
            </div>
          </div>
        )}

        {docType !== "resume" && hasManualWarning && (
          <div className={styles.customToastError}>
            <div className={styles.toastIcon}>❗</div>
            <div className={styles.toastText}>
              {t("manuallyFieldsWarning")}
            </div>
          </div>
        )}


        {config.renderContent({
          styles,
          data,
          formData,
          editMode,
          handleChange,
          withFallback,
          isDark,
          t,
          toggleFile,
          sourceFile,
          showDetails,
          setShowDetails,
          skillsRef,
          experienceRef,
          educationRef,
          hasFile,
          hasWarning,
          hasManualWarning,
        })}

        {editMode && (
          <div className={styles.actionButtons}>
            <button
              onClick={handleSave}
              className={`${styles.saveButton} ${isDark ? styles.darkSaveButton : ""
                }`}
            >
              {t("save") || "Save"}
            </button>
            <button
              onClick={handleCancel}
              className={`${styles.saveButton} ${isDark ? styles.darkSaveButton : ""
                }`}
            >
              {t("cancel") || "Cancel"}
            </button>
          </div>
        )}
      </div>

      {showFile && (
        <div className={filePreviewClass}>
          {hasFile && fileUrl ? (
            sourceFile?.type?.includes("pdf") ||
              (!sourceFile && fileUrl.toLowerCase().includes(".pdf")) ? (
              <iframe src={fileUrl} title="Document preview" />
            ) : sourceFile?.type?.includes("image") ||
              (!sourceFile && /\.(png|jpe?g|gif|webp)$/i.test(fileUrl)) ? (
              <img src={fileUrl} alt="Preview" />
            ) : (
              <p style={{ color: "red", fontWeight: "bold" }}>
                {t("unsupportedFormat")}{" "}
                {sourceFile ? <strong>{sourceFile.name}</strong> : null}
              </p>
            )
          ) : (
            <p style={{ color: "orange", fontWeight: "bold" }}>
              {t("fileNotAvailable") ||
                "Le fichier n'est plus disponible dans cette session. Veuillez le recharger pour voir l'aperçu."}
            </p>
          )}
        </div>
      )}
    </div>
  );
};


export default DocumentResult;
