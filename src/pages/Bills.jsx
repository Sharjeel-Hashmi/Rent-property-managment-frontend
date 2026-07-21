import { useEffect, useState } from "react";
import { MdReceiptLong, MdCheckCircle, MdAttachFile, MdDelete } from "react-icons/md";
import API from "../api/axios.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const Bills = () => {
  const [bills, setBills] = useState([]);
  const [properties, setProperties] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [deleteId, setDeleteId] = useState(null);

  const fetchBills = async () => {
    const { data } = await API.get("/bills", {
      params: propertyFilter ? { property: propertyFilter } : {},
    });
    setBills(data);
  };

  useEffect(() => {
    API.get("/properties").then((res) => setProperties(res.data));
  }, []);

  useEffect(() => {
    fetchBills();
  }, [propertyFilter]);

  const markPaid = async (id) => {
    await API.put(`/bills/${id}/pay`);
    fetchBills();
  };

  const handleDelete = async () => {
    await API.delete(`/bills/${deleteId}`);
    setDeleteId(null);
    fetchBills();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MdReceiptLong /> All Bills
        </h2>
        <select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}
          className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
          <option value="">All Properties</option>
          {properties.map((p) => (
            <option key={p._id} value={p._id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sand-100 text-gray-600 text-left">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Property</th>
              <th className="px-4 py-3">Tenant(s)</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => (
              <tr key={b._id} className="border-t border-sand-100">
                <td className="px-4 py-3">{b.billType}</td>
                <td className="px-4 py-3">{b.property?.name}</td>
                <td className="px-4 py-3">{b.tenants.map((t) => t.tenant?.fullName).join(", ")}</td>
                <td className="px-4 py-3">€{b.totalAmount}</td>
                <td className="px-4 py-3">{new Date(b.billDate).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  {b.isPaid ? (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 flex items-center gap-1 w-fit">
                      <MdCheckCircle size={12} /> Paid
                    </span>
                  ) : (
                    <button onClick={() => markPaid(b._id)} className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100">
                      Mark Paid
                    </button>
                  )}
                </td>
                <td className="px-4 py-3 flex items-center gap-3">
                  {b.attachment?.data && (
                    <a href={`data:${b.attachment.contentType};base64,${b.attachment.data}`}
                      download={b.attachment.fileName} className="text-brand-600 hover:underline">
                      <MdAttachFile size={16} />
                    </a>
                  )}
                  <button onClick={() => setDeleteId(b._id)} className="text-gray-400 hover:text-red-500">
                    <MdDelete size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {bills.length === 0 && <p className="text-sm text-gray-500 p-4">No bills found.</p>}
      </div>

      {deleteId && (
        <ConfirmDialog message="Delete this bill?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
};

export default Bills;
