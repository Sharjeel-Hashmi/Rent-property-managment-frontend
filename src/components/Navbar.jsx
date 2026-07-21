import { MdLogout, MdAccountCircle } from "react-icons/md";
import { useAuth } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <header className="flex items-center justify-between bg-white border-b border-sand-200 px-6 py-4">
      <h2 className="text-lg font-semibold text-brand-800">Admin Dashboard</h2>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <MdAccountCircle size={22} className="text-brand-600" />
          {admin?.name}
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-1 text-sm text-red-500 hover:text-red-600 border border-red-200 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
        >
          <MdLogout size={16} /> Logout
        </button>
      </div>
    </header>
  );
};

export default Navbar;
