import { NavLink } from "react-router-dom";
import {
  MdSpaceDashboard,
  MdApartment,
  MdPeopleAlt,
  MdReceiptLong,
  MdHomeWork,
} from "react-icons/md";

const links = [
  { to: "/", label: "Dashboard", icon: <MdSpaceDashboard size={20} />, end: true },
  { to: "/properties", label: "Properties", icon: <MdApartment size={20} /> },
  { to: "/tenants", label: "Rent Members", icon: <MdPeopleAlt size={20} /> },
  { to: "/bills", label: "Bills", icon: <MdReceiptLong size={20} /> },
];

const Sidebar = () => {
  return (
    <aside className="hidden md:flex md:flex-col w-64 bg-brand-800 text-white min-h-screen p-5">
      <div className="flex items-center gap-2 mb-10 px-2">
        <MdHomeWork size={28} className="text-brand-200" />
        <div>
          <h1 className="font-bold text-lg leading-tight">RentEase</h1>
          <p className="text-xs text-brand-200">Property Management</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                isActive
                  ? "bg-brand-600 text-white font-medium"
                  : "text-brand-100 hover:bg-brand-700"
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;
