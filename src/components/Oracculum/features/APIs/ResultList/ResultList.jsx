import React, { useContext, useEffect } from "react";
import { useSession } from "../../../../../context/SessionContext";
import { ThemeContext } from "../../../../../context/ThemeContext";
import { countryData } from "../../../../../constants/countryFlags";
import ResultCard from "../ResultCard/ResultCard";
import styles from "./ResultList.module.css";
import { useTranslation } from "../../../../../utils/useTranslation";

const ResultList = () => {
    const { t } = useTranslation();
    const { selectedCountry, searchTerm, setDetectedCountries } = useSession();
    const {
        extractedData,
        setSelectedCards,
        filterMode
    } = useSession();

    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";
    const [currentPage, setCurrentPage] = React.useState(1);
    const itemsPerPage = 5;
    useEffect(() => {
        if (!extractedData || extractedData.length === 0) {
            setDetectedCountries([]);
            return;
        }
        const unique = filterUniqueSmart(extractedData);

        const countries = [];
        const seen = new Set();

        unique.forEach((item) => {
            const rawCountry = item.nationality || item.code_pays || item.issuing_country;
            const info = findCountryInfo(rawCountry);
            if (!info) return;

            const key = info.name.toLowerCase();
            if (seen.has(key)) return;

            seen.add(key);
            countries.push({ name: info.name, flag: info.flag });
        });

        setDetectedCountries(countries);
    }, [extractedData, setDetectedCountries]);

    useEffect(() => {
        if (filterMode === "All" && extractedData.length > 0) {
            const allIds = extractedData
                .filter((item) =>
                    !Object.values(item).some(
                        (val) =>
                            typeof val === "string" &&
                            val.toLowerCase().includes("please enter manually")
                    )
                )
                .map(getUniqueId)
                .filter((id) => id !== null);

            setSelectedCards((prev) => {
                const newIds = allIds.filter((id) => !prev.includes(id));
                return [...prev, ...newIds];
            });
        }

    }, [filterMode, extractedData, setSelectedCards]);

    if (!extractedData || extractedData.length === 0) return null;

    const getUniqueId = (item) => {
        const clean = (val) =>
            typeof val === "string" && val.toLowerCase().includes("please enter manually")
                ? null
                : val;

        const exportId =
            clean(item.full_name) && clean(item.date)
                ? `${item.full_name}__${item.date}`
                : null;
        const rawIban = item.code_iban || "";
        const rawBic = item.code_bic || "";
        const cleanIban = rawIban.replace(/\s+/g, "");
        const cleanBic = rawBic.replace(/\s+/g, "");

        const isIbanManual = rawIban.toLowerCase().includes("please enter manually");
        const isBicManual = rawBic.toLowerCase().includes("please enter manually");

        const bankId = !isIbanManual && !isBicManual && cleanIban && cleanBic
            ? `${cleanIban}${cleanBic}`
            : null;
        const diplomaID =
            clean(item.fullname) && clean(item.graduation_date)
                ? `${item.fullname}__${item.graduation_date}`
                : null;

        const baseId =
            clean(item.document_number) ||
            clean(item.id_number) ||
            clean(item.passport_number) ||
            clean(item.email) ||
            clean(item.document_id) ||
            clean(bankId) ||
            clean(exportId) ||
            clean(diplomaID);

        return baseId || `fallback__${item.filename || "nofile"}__${Math.random().toString(36).substring(2, 8)}`;
    };
    const filterUniqueSmart = (data) => {
        const map = new Map();

        data.forEach((item) => {
            const id = getUniqueId(item);
            const fallbackId = `fallback__${Math.random().toString(36).substring(2, 10)}`;

            const key = id || fallbackId;

            const isManual = Object.values(item).some(
                (val) =>
                    typeof val === "string" &&
                    val.toLowerCase().includes("please enter manually")
            );

            const existing = map.get(key);

            if (!existing) {
                map.set(key, item);
            } else {
                const isExistingManual = Object.values(existing).some(
                    (val) =>
                        typeof val === "string" &&
                        val.toLowerCase().includes("please enter manually")
                );

                if (isExistingManual && !isManual) {
                    map.set(key, item);
                }
            }
        });

        return Array.from(map.values());
    };
    const findCountryInfo = (input) => {
        if (!input) return null;
        const lower = input.toLowerCase();
        const match = countryData.find(
            (c) =>
                c.name.toLowerCase() === lower ||
                c.isoAlpha2?.toLowerCase() === lower ||
                c.isoAlpha3?.toLowerCase() === lower ||
                (Array.isArray(c.aliases) &&
                    c.aliases.some((alias) => alias.toLowerCase() === lower))
        );
        if (!match) return null;
        return {
            name: match.name,
            flag: match.flag || "🏳️",
        };
    };


    const normalizeCountry = (input) => {
        if (!input) return "";
        const lower = input.toLowerCase();
        const match = countryData.find(
            (c) =>
                c.name.toLowerCase() === lower ||
                c.isoAlpha2?.toLowerCase() === lower ||
                c.isoAlpha3?.toLowerCase() === lower ||
                (Array.isArray(c.aliases) &&
                    c.aliases.some((alias) => alias.toLowerCase() === lower))
        );
        return match?.name.toLowerCase() || lower;
    };


    const hasSearch = searchTerm?.trim().length > 0;
    const hasCountry = selectedCountry?.toLowerCase() !== "anywhere";
    const uniqueData = filterUniqueSmart(extractedData);

    const filteredData = uniqueData.filter((item) => {
        const matchesSearch = hasSearch
            ? Object.values(item).some(
                (val) =>
                    typeof val === "string" &&
                    val.toLowerCase().includes(searchTerm.toLowerCase())
            )
            : true;

        const itemCountry =
            item.nationality || item.code_pays || item.issuing_country; 

        const matchesCountry = hasCountry
            ? normalizeCountry(itemCountry) === normalizeCountry(selectedCountry)
            : true;

        return matchesSearch && matchesCountry;
    });


    const totalPages = Math.ceil(filteredData.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedData = filteredData.slice(startIndex, endIndex);

    return (
        <div className={styles.resultList}>
            <h2 className={`${styles.title} ${isDark ? styles.darkTitle : ""}`}>
                {t("we_found")}{" "}
                <span style={{ color: "#E7433C", fontWeight: "bold" }}>
                    {filteredData.length}
                </span>{" "}
                {filteredData.length === 1 ? t("user_found_singular") : t("user_found_plural")}!
            </h2>

            {paginatedData.map((item, index) => {
                const key = getUniqueId(item) || `fallback_${index}`;
                return <ResultCard key={key} data={item} />;
            })}
            {filteredData.length > itemsPerPage && (
                <div className={styles.pagination}>
                    <button
                        className={`${styles.pageButton} ${isDark ? styles.darkPageButton : ""}`}
                        onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                        disabled={currentPage === 1}
                    >
                        &lt;
                    </button>

                    <span className={`${styles.pageInfo} ${isDark ? styles.darkPageInfo : ""}`}>
                        {currentPage} / {totalPages}
                    </span>

                    <button
                        className={`${styles.pageButton} ${isDark ? styles.darkPageButton : ""}`}
                        onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                        disabled={currentPage === totalPages}
                    >
                        &gt;
                    </button>
                </div>
            )}


        </div>

    );
};

export default ResultList;
