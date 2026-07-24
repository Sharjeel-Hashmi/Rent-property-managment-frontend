import { useEffect, useState } from "react";
import { MdReceiptLong, MdCheckCircle, MdAttachFile, MdDelete } from "react-icons/md";
import API from "../api/axios.js";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-"); // dd/mm/yyyy

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

  // Toggle just one tenant's share within a bill
  const toggleTenantPaid = async (billId, tenantId) => {
    const { data } = await API.put(`/bills/${billId}/pay/${tenantId}`);
    setBills((prev) => prev.map((b) => (b._id === billId ? data : b)));
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
              <th className="px-4 py-3">Billing Period</th>
              <th className="px-4 py-3">Tenant(s) — click to toggle paid</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {bills.map((b) => {
              const paidCount = b.tenants.filter((t) => t.isPaid).length;
              const allPaid = paidCount === b.tenants.length && b.tenants.length > 0;
              return (
                <tr key={b._id} className="border-t border-sand-100 align-top">
                  <td className="px-4 py-3">{b.billType}</td>
                  <td className="px-4 py-3">{b.property?.name}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {b.billPeriodStart && b.billPeriodEnd
                      ? `${fmtDate(b.billPeriodStart)} - ${fmtDate(b.billPeriodEnd)}`
                      : fmtDate(b.billDate)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      {b.tenants.map((t) => (
                        <button
                          key={t.tenant?._id}
                          onClick={() => toggleTenantPaid(b._id, t.tenant?._id)}
                          title={`€${t.shareAmount} — click to mark ${t.isPaid ? "unpaid" : "paid"}`}
                          className={`text-xs px-2 py-0.5 rounded-full flex items-center gap-1 font-medium ${
                            t.isPaid ? "bg-brand-50 text-brand-700 hover:bg-brand-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                          }`}
                        >
                          {t.isPaid && <MdCheckCircle size={11} />} {t.tenant?.fullName}
                        </button>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">€{b.totalAmount}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      allPaid ? "bg-brand-50 text-brand-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {paidCount}/{b.tenants.length} Paid
                    </span>
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
              );
            })}
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