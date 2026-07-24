import { useEffect, useState } from "react";
import { MdUploadFile } from "react-icons/md";
import API from "../api/axios.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import Modal from "./Modal.jsx";
import DateInput from "./DateInput.jsx";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// How many days a tenant was actually present between periodStart and periodEnd
// (accounts for moving in mid-period and moving out mid-period)
const daysPresentInPeriod = (t, periodStart, periodEnd) => {
  if (!periodStart || !periodEnd) return 0;
  const pStart = new Date(periodStart);
  const pEnd = new Date(periodEnd);
  const moveIn = new Date(t.moveInDate);
  const moveOut = t.moveOutDate ? new Date(t.moveOutDate) : null;

  const effectiveStart = moveIn > pStart ? moveIn : pStart;
  const effectiveEnd = moveOut && moveOut < pEnd ? moveOut : pEnd;

  if (effectiveStart > effectiveEnd) return 0;
  return Math.round((effectiveEnd - effectiveStart) / MS_PER_DAY) + 1;
};

const totalDaysInPeriod = (periodStart, periodEnd) => {
  if (!periodStart || !periodEnd) return 0;
  const days = Math.round((new Date(periodEnd) - new Date(periodStart)) / MS_PER_DAY) + 1;
  return Math.max(days, 0);
};

// propertyId: required. defaultTenantId: optional, preselects + auto-picks that tenant's property.
const BillFormModal = ({ propertyId, defaultTenantId, onClose, onSaved }) => {
  const [propertyTenants, setPropertyTenants] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState(defaultTenantId ? [defaultTenantId] : []);
  const [splitMethod, setSplitMethod] = useState("equal"); // "equal" | "prorate"

  const [billType, setBillType] = useState("Electricity");
  const [billPeriodStart, setBillPeriodStart] = useState("");
  const [billPeriodEnd, setBillPeriodEnd] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!propertyId) return;
    API.get("/tenants", { params: { property: propertyId } }).then((res) =>
      setPropertyTenants(res.data)
    );
  }, [propertyId]);

  const toggleTenant = (id) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const periodDays = totalDaysInPeriod(billPeriodStart, billPeriodEnd);

  // Live preview of each selected tenant's share
  const computeShares = () => {
    const amount = Number(totalAmount) || 0;
    const tenantsList = selectedTenants.map(
      (tid) => propertyTenants.find((pt) => pt._id === tid)
    ).filter(Boolean);

    if (splitMethod === "equal") {
      const n = tenantsList.length || 1;
      const equalShare = Math.round((amount / n) * 100) / 100;
      return tenantsList.map((t) => ({ tenant: t, shareAmount: equalShare }));
    }

    // Prorate by days present in the billing period — full amount split
    // proportionally so shares always add up to the total bill.
    const withDays = tenantsList.map((t) => ({
      tenant: t,
      days: daysPresentInPeriod(t, billPeriodStart, billPeriodEnd),
    }));
    const totalPresentDays = withDays.reduce((sum, x) => sum + x.days, 0) || 1;

    return withDays.map((x) => ({
      tenant: x.tenant,
      shareAmount: Math.round((amount * (x.days / totalPresentDays)) * 100) / 100,
      days: x.days,
    }));
  };

  const shares = computeShares();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (selectedTenants.length === 0) {
      setError("Kam az kam ek member select karein");
      return;
    }
    if (splitMethod === "prorate" && (!billPeriodStart || !billPeriodEnd)) {
      setError("Prorate by days ke liye Billing Period Start aur End dono dein");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        property: propertyId,
        billType,
        billPeriodStart: billPeriodStart || undefined,
        billPeriodEnd: billPeriodEnd || undefined,
        splitMethod,
        totalAmount: Number(totalAmount),
        billDate,
        dueDate: dueDate || undefined,
        tenants: shares.map((s) => ({
          tenant: s.tenant._id,
          shareAmount: s.shareAmount,
          daysPresent: s.days,
        })),
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

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Billing Period Start</label>
            <DateInput value={billPeriodStart} onChange={setBillPeriodStart} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Billing Period End</label>
            <DateInput value={billPeriodEnd} onChange={setBillPeriodEnd} />
          </div>
        </div>
        {billPeriodStart && billPeriodEnd && (
          <p className="text-xs text-gray-400 -mt-2">Period length: {periodDays} day(s) — can span more than one month</p>
        )}

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
            {propertyTenants.length === 0 && (
              <p className="text-sm text-gray-400">No rent members found for this property.</p>
            )}
          </div>
        </div>

        {selectedTenants.length > 1 && (
          <div className="flex gap-4 text-sm text-gray-600">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="splitMethod" checked={splitMethod === "equal"}
                onChange={() => setSplitMethod("equal")} />
              Equal Split
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input type="radio" name="splitMethod" checked={splitMethod === "prorate"}
                onChange={() => setSplitMethod("prorate")} />
              Prorate by Days (billing period)
            </label>
          </div>
        )}

        {totalAmount && selectedTenants.length > 0 && (
          <div className="bg-sand-50 rounded-lg p-3 text-sm">
            <p className="text-xs text-gray-500 mb-1">Each person will pay:</p>
            {shares.map((s) => (
              <div key={s.tenant._id} className="flex justify-between">
                <span>
                  {s.tenant.fullName}
                  {splitMethod === "prorate" && s.days !== undefined && (
                    <span className="text-xs text-amber-600"> ({s.days}/{periodDays} days)</span>
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