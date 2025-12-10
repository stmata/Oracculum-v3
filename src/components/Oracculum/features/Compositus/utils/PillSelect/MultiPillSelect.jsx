import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PillSelect.module.css";

export default function MultiPillSelect({
  values = [],
  onChange,
  options = [],
  placeholder = "Sélectionner...",
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const rootRef = useRef(null);
  const btnRef = useRef(null);

  const selectedLabels = useMemo(() => {
    if (!values.length) return placeholder;
    if (values.length === options.length)
      return "Tous sélectionnés";
    if (values.length === 1)
      return options.find(o => o.value === values[0])?.label || placeholder;
    return `${values.length} sélectionné(s)`;
  }, [values, options, placeholder]);

  const openMenu = () => {
    setOpen(true);
    setHighlight(0);
  };

  const toggleValue = (val) => {
    const exists = values.includes(val);
    const next = exists ? values.filter(v => v !== val) : [...values, val];
    onChange?.(next);
  };

  useEffect(() => {
    const handleDocClick = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handleDocClick);
    return () => document.removeEventListener("mousedown", handleDocClick);
  }, []);

  const onKeyDown = (e) => {
    if (!open && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) {
      e.preventDefault();
      openMenu();
      return;
    }
    if (!open) return;

    if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(options.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) toggleValue(opt.value);
    }
  };

  return (
    <div
      ref={rootRef}
      className={[
        styles.customSelect,
        open ? styles.isOpen : "",
        className,
      ].join(" ").trim()}
    >
      <button
        ref={btnRef}
        type="button"
        className={styles.toggle}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onKeyDown={onKeyDown}
      >
        <span className={styles.label}>{selectedLabels}</span>
      </button>

      {open && (
        <ul className={styles.menu2} role="listbox">
          {options.map((opt, i) => {
            const checked = values.includes(opt.value);
            const highlighted = i === highlight;
            return (
              <li
                key={opt.value}
                role="option"
                aria-selected={checked}
                className={[
                  styles.option2,
                  checked ? styles.isSelected2 : "",
                  highlighted ? styles.isHighlighted2 : "",
                ].join(" ").trim()}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => toggleValue(opt.value)}
              >
                <label style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <input
                    type="checkbox"
                    checked={checked}
                    readOnly
                    className={styles.chkInput}
                  />
                  {opt.label}
                </label>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
