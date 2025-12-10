import React, { useContext } from 'react'
import { ThemeContext } from '../../../../../context/ThemeContext'
import styles from './FilterBar.module.css'
import CustomSelect from './CustomSelect'
import { useSession } from "../../../../../context/SessionContext";
import { useTranslation } from "../../../../../utils/useTranslation";
const FilterBar = () => {
  const { theme } = useContext(ThemeContext);
  const isDark = theme === "dark";

  const { t } = useTranslation();

  const {
    selectedCountry,
    setSelectedCountry,
    searchTerm,
    setSearchTerm,
    detectedCountries,
  } = useSession();

  const safeDetected = Array.isArray(detectedCountries)
    ? detectedCountries
    : [];

  const countryOptions = [
    { code: "anywhere", flag: "📡" },
    ...safeDetected.map((c) => ({
      code: c.name,
      flag: c.flag,
    })),
  ];

  const handleCountryChange = (value) => setSelectedCountry(value);
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  return (
    <div className={`${styles.filterBar} ${isDark ? styles.dark : ''}`}>
      <div className={styles.title}>{t("results")}</div>
      <div className={styles.controls}>
        <div className={styles.searchWrapper}>
          <span className={styles.icon}>🔍</span>
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            className={styles.searchInput}
            value={searchTerm}
            onChange={handleSearchChange}
          />
        </div>
        <div>

        </div>
        <CustomSelect
          options={countryOptions}
          value={countryOptions.find((c) => c.code === selectedCountry)}
          onChange={(selected) => handleCountryChange(selected.code)}
          getOptionLabel={(option) =>
            option.code === "anywhere"
              ? `${option.flag} ${t("anywhere")}`
              : `${option.flag} ${option.code}`
          }
          icon="📍"
        />

      </div>
    </div>
  )
}

export default FilterBar
