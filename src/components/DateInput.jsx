import { useEffect, useRef, useState } from "react";
import { MdCalendarToday } from "react-icons/md";

// A dd/mm/yyyy text date input with a working calendar picker button.
// value: ISO date string "YYYY-MM-DD" (or full ISO), onChange receives "YYYY-MM-DD"
const isoToDisplay = (iso) => {
  if (!iso) return "";
  const datePart = iso.substring(0, 10);
  const [y, m, d] = datePart.split("-");
  if (!y || !m || !d) return "";
  return `${d}/${m}/${y}`;
};

const displayToIso = (display) => {
  const match = display.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return null;
  const [, d, m, y] = match;
  const date = new Date(`${y}-${m}-${d}`);
  if (isNaN(date.getTime())) return null;
  return `${y}-${m}-${d}`;
};

const DateInput = ({ value, onChange, required, className = "" }) => {
  const [text, setText] = useState(isoToDisplay(value));
  const hiddenDateRef = useRef(null);

  useEffect(() => {
    setText(isoToDisplay(value));
  }, [value]);

  const handleChange = (e) => {
    let raw = e.target.value.replace(/[^\d]/g, "").slice(0, 8);
    let formatted = raw;
    if (raw.length > 4) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2, 4)}/${raw.slice(4)}`;
    } else if (raw.length > 2) {
      formatted = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setText(formatted);

    const iso = displayToIso(formatted);
    if (iso) onChange(iso);
  };

  const openPicker = () => {
    const el = hiddenDateRef.current;
    if (!el) return;
    if (typeof el.showPicker === "function") {
      el.showPicker();
    } else {
      el.click();
      el.focus();
    }
  };

  const handleHiddenDateChange = (e) => {
    const iso = e.target.value; // already YYYY-MM-DD
    if (iso) {
      setText(isoToDisplay(iso));
      onChange(iso);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        required={required}
        placeholder="dd/mm/yyyy"
        value={text}
        onChange={handleChange}
        maxLength={10}
        className={`border border-sand-200 rounded-lg px-3 py-2 text-sm w-full pr-9 ${className}`}
      />
      <button
        type="button"
        onClick={openPicker}
        className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-600"
        tabIndex={-1}
      >
        <MdCalendarToday size={16} />
      </button>
      {/* Hidden native date input purely used to open a real calendar picker */}
      <input
        ref={hiddenDateRef}
        type="date"
        value={value ? value.substring(0, 10) : ""}
        onChange={handleHiddenDateChange}
        className="absolute inset-0 w-0 h-0 opacity-0 pointer-events-none"
        tabIndex={-1}
      />
    </div>
  );
};

export default DateInput;
