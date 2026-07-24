import { useEffect, useState } from "react";
import { MdCalendarToday } from "react-icons/md";

// A simple dd/mm/yyyy text date input.
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
      <MdCalendarToday className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
    </div>
  );
};

export default DateInput;
