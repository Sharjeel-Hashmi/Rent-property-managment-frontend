import { useEffect, useState } from "react";
import { MdUploadFile } from "react-icons/md";
import API from "../api/axios.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import Modal from "./Modal.jsx";
import DateInput from "./DateInput.jsx";

const daysInMonth = (year, month) => new Date(year, month, 0).getDate(); // month: 1-12

// Days a tenant was actually present during the given "YYYY-MM" billing month
const daysPresentInMonth = (moveInDate, periodMonth) => {
  const [y, m] = periodMonth.split("-").map(Number);
  const totalDays = daysInMonth(y, m);
  const monthStart = new Date(y, m - 1, 1);
  const monthEnd = new Date(y, m - 1, totalDays);
  const moveIn = new Date(moveInDate);

  if (moveIn > monthEnd) return { present: 0, totalDays };
  const effectiveStart = moveIn > monthStart ? moveIn : monthStart;
  const present = Math.round((monthEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;
  return { present: Math.max(present, 0), totalDays };
};

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const BillFormModal = ({ tenant, onClose, onSaved }) => {
  const propertyId = tenant.property?._id || tenant.property;

  const [propertyTenants, setPropertyTenants] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState([tenant._id]);
  const [prorate, setProrate] = useState(true);

  const [billType, setBillType] = useState("Electricity");
  const [billPeriodMonth, setBillPeriodMonth] = useState(getCurrentMonth());
  const [totalAmount, setTotalAmount] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get("/tenants", { params: { property: propertyId, status: "active" } }).then((res) =>
      setPropertyTenants(res.data)
    );
  }, [propertyId]);

  const toggleTenant = (id) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  // Live preview of each selected tenant's share
  const computeShares = () => {
    const amount = Number(totalAmount) || 0;
    const n = selectedTenants.length || 1;
    const equalShare = Math.round((amount / n) * 100) / 100;

    return selectedTenants.map((tid) => {
      const t = propertyTenants.find((pt) => pt._id === tid) || tenant;
      if (!prorate) return { tenant: t, shareAmount: equalShare };

      const { present, totalDays } = daysPresentInMonth(t.moveInDate, billPeriodMonth);
      const shareAmount = Math.round((equalShare * (present / totalDays)) * 100) / 100;
      return { tenant: t, shareAmount, present, totalDays };
    });
  };

  const shares = computeShares();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedTenants.length === 0) {
      setError("Kam az kam ek member select karein");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        property: propertyId,
        billType,
        billPeriodMonth,
        totalAmount: Number(totalAmount),
        billDate,
        dueDate: dueDate || undefined,
        tenants: shares.map((s) => ({ tenant: s.tenant._id, shareAmount: s.shareAmount })),
      };

      if (file) {
        const base64 = await fileToBase64(file);
        payload.attachment = { data: base64, contentType: file.type, fileName: file.name };
      }

      await API.post("/bills", payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save bill");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title="Add Bill" onClose={onClose} wide>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="grid grid-cols-2 gap-3">
          <select value={billType} onChange={(e) => setBillType(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
            <option>Electricity</option>
            <option>Gas</option>
            <option>Internet</option>
            <option>Water</option>
            <option>Other</option>
          </select>
          <input required type="number" step="0.01" min="0" placeholder="Total Amount (€) e.g. 145.80" value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Bill Date</label>
            <DateInput required value={billDate} onChange={setBillDate} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Due Date (optional)</label>
            <DateInput value={dueDate} onChange={setDueDate} />
          </div>
        </div>
        <div>
          <label className="text-xs text-gray-500">Billing Month (for proration)</label>
          <input type="month" value={billPeriodMonth} onChange={(e) => setBillPeriodMonth(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full" />
        </div>

        <div>
          <p className="text-xs text-gray-500 mb-2">Split between which members?</p>
          <div className="flex flex-wrap gap-2">
            {propertyTenants.map((t) => (
              <button type="button" key={t._id} onClick={() => toggleTenant(t._id)}
                className={`px-3 py-1.5 rounded-lg text-sm border ${
                  selectedTenants.includes(t._id)
                    ? "bg-brand-600 text-white border-brand-600"
                    : "border-sand-200 text-gray-600 hover:bg-sand-50"
                }`}>
                {t.fullName}
              </button>
            ))}
          </div>
        </div>

        {selectedTenants.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={prorate} onChange={(e) => setProrate(e.target.checked)} />
            Proportionally adjust by days stayed in this month (for members who moved in mid-month)
          </label>
        )}

        {totalAmount && selectedTenants.length > 0 && (
          <div className="bg-sand-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">Each person will pay:</p>
            {shares.map((s) => (
              <div key={s.tenant._id} className="flex justify-between">
                <span>
                  {s.tenant.fullName}
                  {prorate && s.present !== undefined && s.present < s.totalDays && (
                    <span className="text-xs text-amber-600"> ({s.present}/{s.totalDays} days)</span>
                  )}
                </span>
                <span className="font-medium">€{s.shareAmount}</span>
              </div>
            ))}
          </div>
        )}

        <label className="flex items-center gap-2 text-sm text-brand-600 cursor-pointer w-fit">
          <MdUploadFile /> {file ? file.name : "Attach bill (image/PDF)"}
          <input type="file" accept="image/*,application/pdf" className="hidden"
            onChange={(e) => setFile(e.target.files[0])} />
        </label>

        <button type="submit" disabled={saving}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium mt-2 disabled:opacity-60">
          {saving ? "Saving..." : "Add Bill"}
        </button>
      </form>
    </Modal>
  );
};

export default BillFormModal;
