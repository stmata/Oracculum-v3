import React, { useState, useRef, useEffect, useContext } from "react";
import styles from "./FilterBar.module.css";
import { FaChevronDown, FaChevronUp } from "react-icons/fa";
import { useTranslation } from "../../../../../utils/useTranslation";
import { ThemeContext } from "../../../../../context/ThemeContext";

const CustomSelect = ({
    options,
    value,
    onChange,
    getOptionLabel = (opt) => opt.name || opt,
    icon
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef();
    const { t } = useTranslation();

    const { theme } = useContext(ThemeContext);
    const isDark = theme === "dark";

    const handleOptionClick = (opt) => {
        onChange(opt);
        setIsOpen(false);
    };

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (selectRef.current && !selectRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div
            ref={selectRef}
            className={`
        ${styles.customSelect}
        ${isDark ? styles.darkk : ""}
      `}
            data-icon={icon || "📍"}
        >
            <div
                className={styles.selected}
                onClick={() => setIsOpen((prev) => !prev)}
            >
                {value ? getOptionLabel(value) : t("anywhere")}
                {isOpen
                    ? <FaChevronUp className={styles.arrow} />
                    : <FaChevronDown className={styles.arrow} />
                }
            </div>

            {isOpen && (
                <ul className={styles.optionsList}>
                    {options.map((opt, i) => (
                        <li
                            key={i}
                            className={
                                (value?.name || value) === (opt?.name || opt)
                                    ? styles.selectedOption
                                    : styles.unselectedOption
                            }
                            onClick={() => handleOptionClick(opt)}
                        >
                            {getOptionLabel(opt)}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default CustomSelect;
