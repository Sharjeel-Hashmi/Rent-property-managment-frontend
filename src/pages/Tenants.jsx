import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdPerson } from "react-icons/md";
import API from "../api/axios.js";

const Tenants = () => {
  const [tenants, setTenants] = useState([]);
  const [statusFilter, setStatusFilter] = useState("");

  const fetchTenants = async () => {
    const { data } = await API.get("/tenants", {
      params: statusFilter ? { status: statusFilter } : {},
    });
    setTenants(data);
  };

  useEffect(() => {
    fetchTenants();
  }, [statusFilter]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800">Rent Members</h2>
        <div className="flex items-center gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="notice-given">Notice Given</option>
            <option value="moved-out">Moved Out</option>
          </select>
          <Link
            to="/tenants/new"
            className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg"
          >
            <MdAdd size={18} /> Add Rent Member
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-100 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Rooms</th>
              <th className="px-4 py-3">Rent</th>
              <th className="px-4 py-3">Deposit</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => (
              <tr
                key={t._id}
                onClick={() => (window.location.href = `/tenants/${t._id}`)}
                className="border-t border-sand-100 hover:bg-sand-50 cursor-pointer"
              >
                <td className="px-4 py-3 flex items-center gap-2">
                  <MdPerson className="text-brand-500" /> {t.fullName}
                </td>
                <td className="px-4 py-3">{t.property?.name}</td>
                <td className="px-4 py-3">{t.rooms.join(", ") || "-"}</td>
                <td className="px-4 py-3">€{t.rentAmount}/{t.rentFrequency}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.depositPaid ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
                  }`}>
                    {t.depositPaid ? "Paid" : "Not Paid"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    t.status === "active" ? "bg-brand-50 text-brand-700" :
                    t.status === "notice-given" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
                  }`}>
                    {t.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tenants.length === 0 && <p className="text-sm text-gray-500 p-4">No rent members found.</p>}
      </div>
    </div>
  );
};

export default Tenants;
