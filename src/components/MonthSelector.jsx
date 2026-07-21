import { MdChevronLeft, MdChevronRight } from "react-icons/md";

const monthNames = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// value format: "YYYY-MM"
const MonthSelector = ({ value, onChange }) => {
  const [year, month] = value.split("-").map(Number);

  const shift = (delta) => {
    const date = new Date(year, month - 1 + delta, 1);
    const newValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    onChange(newValue);
  };

  return (
    <div className="flex items-center gap-2 bg-sand-100 rounded-lg px-2 py-1">
      <button
        type="button"
        onClick={() => shift(-1)}
        className="text-gray-500 hover:text-brand-600 p-1"
      >
        <MdChevronLeft size={18} />
      </button>
      <span className="text-sm font-medium text-gray-700 w-32 text-center">
        {monthNames[month - 1]} {year}
      </span>
      <button
        type="button"
        onClick={() => shift(1)}
        className="text-gray-500 hover:text-brand-600 p-1"
      >
        <MdChevronRight size={18} />
      </button>
    </div>
  );
};

export default MonthSelector;
