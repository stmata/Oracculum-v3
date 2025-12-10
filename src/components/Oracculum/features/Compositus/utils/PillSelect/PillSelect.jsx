import React, { useEffect, useMemo, useRef, useState } from "react";
import styles from "./PillSelect.module.css";

export default function PillSelect({
  value,
  onChange,
  options = [],
  placeholder = "Position",
  iconRight = null,
  className = "",
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);

  const rootRef = useRef(null);
  const btnRef = useRef(null);

  const label = useMemo(() => {
    const found = options.find(o => o.value === value);
    return found ? found.label : placeholder;
  }, [options, value, placeholder]);

  const openMenu = () => {
    setOpen(true);
    const idx = options.findIndex(o => o.value === value);
    setHighlight(idx >= 0 ? idx : 0);
  };

  const commit = (val) => {
    onChange?.(val);
    setOpen(false);
    btnRef.current?.focus();
  };

  useEffect(() => {
    const onDocDown = (e) => {
      if (!rootRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", onDocDown);
    return () => document.removeEventListener("mousedown", onDocDown);
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
      setHighlight(h => Math.min(options.length - 1, h + 1));
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight(h => Math.max(0, h - 1));
      return;
    }
    if (e.key === "Enter") {
      e.preventDefault();
      const opt = options[highlight];
      if (opt) commit(opt.value);
    }
  };

  return (
    <div
      ref={rootRef}
      className={[
        styles.customSelect,
        open ? styles.isOpen : "",
        className
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
        <span className={styles.label} title={label}>{label}</span>
        {iconRight ? <span className={styles.iconRight}>{iconRight}</span> : null}
      </button>

      {open && (
        <ul className={styles.menu} role="listbox">
          {options.map((opt, i) => {
            const selected = opt.value === value;
            const highlighted = i === highlight;
            return (
              <li
                key={opt.value ?? i}
                role="option"
                aria-selected={selected}
                className={[
                  styles.option,
                  selected ? styles.isSelected : "",
                  highlighted ? styles.isHighlighted : ""
                ].join(" ").trim()}
                onMouseEnter={() => setHighlight(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => commit(opt.value)}
              >
                {opt.label}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
