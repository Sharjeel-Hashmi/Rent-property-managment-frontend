import { useEffect, useState } from "react";
import { MdUploadFile, MdClose, MdAttachFile } from "react-icons/md";
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

const toDateInputValue = (d) => (d ? String(d).substring(0, 10) : "");

// propertyId: required for a new bill. defaultTenantId: optional, preselects a tenant.
// bill: pass an existing bill object to edit it instead of creating a new one.
const BillFormModal = ({ propertyId, defaultTenantId, bill, onClose, onSaved }) => {
  const isEdit = Boolean(bill);
  const resolvedPropertyId = propertyId || bill?.property?._id || bill?.property;

  const [propertyTenants, setPropertyTenants] = useState([]);
  const [selectedTenants, setSelectedTenants] = useState(
    isEdit
      ? bill.tenants.map((t) => t.tenant?._id || t.tenant)
      : (defaultTenantId ? [defaultTenantId] : [])
  );
  const [splitMethod, setSplitMethod] = useState(bill?.splitMethod || "equal");

  const [billType, setBillType] = useState(bill?.billType || "Electricity");
  const [billPeriodStart, setBillPeriodStart] = useState(toDateInputValue(bill?.billPeriodStart));
  const [billPeriodEnd, setBillPeriodEnd] = useState(toDateInputValue(bill?.billPeriodEnd));
  const [totalAmount, setTotalAmount] = useState(bill?.totalAmount ?? "");
  const [billDate, setBillDate] = useState(toDateInputValue(bill?.billDate));
  const [dueDate, setDueDate] = useState(toDateInputValue(bill?.dueDate));
  const [file, setFile] = useState(null);
  const [removeExistingAttachment, setRemoveExistingAttachment] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!resolvedPropertyId) return;
    API.get("/tenants", { params: { property: resolvedPropertyId } }).then((res) =>
      setPropertyTenants(res.data)
    );
  }, [resolvedPropertyId]);

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
        property: resolvedPropertyId,
        billType,
        billPeriodStart: billPeriodStart || undefined,
        billPeriodEnd: billPeriodEnd || undefined,
        splitMethod,
        totalAmount: Number(totalAmount),
        billDate,
        dueDate: dueDate || undefined,
        tenants: shares.map((s) => {
          // Keep an already-paid tenant's paid status/date when editing —
          // only newly-added members start out unpaid.
          const old = isEdit
            ? bill.tenants.find((t) => String(t.tenant?._id || t.tenant) === String(s.tenant._id))
            : null;
          return {
            tenant: s.tenant._id,
            shareAmount: s.shareAmount,
            daysPresent: s.days,
            isPaid: old?.isPaid || false,
            paidDate: old?.isPaid ? old.paidDate : undefined,
          };
        }),
      };

      if (file) {
        const base64 = await fileToBase64(file);
        payload.attachment = { data: base64, contentType: file.type, fileName: file.name };
      } else if (isEdit && removeExistingAttachment) {
        payload.attachment = null;
      }

      if (isEdit) {
        await API.put(`/bills/${bill._id}`, payload);
      } else {
        await API.post("/bills", payload);
      }
      onSaved();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save bill");
    } finally {
      setSaving(false);
    }
  };

  const hasExistingAttachment = isEdit && bill.attachment?.data && !removeExistingAttachment && !file;

  return (
    <Modal title={isEdit ? "Edit Bill" : "Add Bill"} onClose={onClose} wide>
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

        {hasExistingAttachment && (
          <div className="flex items-center gap-2 text-sm">
            <a href={`data:${bill.attachment.contentType};base64,${bill.attachment.data}`}
              download={bill.attachment.fileName} className="text-brand-600 hover:underline flex items-center gap-1">
              <MdAttachFile size={16} /> {bill.attachment.fileName || "Current attachment"}
            </a>
            <button type="button" onClick={() => setRemoveExistingAttachment(true)}
              className="text-red-500 hover:text-red-600 text-xs flex items-center gap-0.5">
              <MdClose size={14} /> Remove
            </button>
          </div>
        )}

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-brand-600 cursor-pointer w-fit">
            <MdUploadFile /> {file ? file.name : hasExistingAttachment ? "Replace attachment" : "Attach bill (image/PDF)"}
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => { setFile(e.target.files[0]); setRemoveExistingAttachment(false); }} />
          </label>
          {file && (
            <button type="button" onClick={() => setFile(null)}
              className="text-red-500 hover:text-red-600 text-xs flex items-center gap-0.5">
              <MdClose size={14} /> Remove selected file
            </button>
          )}
        </div>

        <button type="submit" disabled={saving}
          className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium mt-2 disabled:opacity-60">
          {saving ? "Saving..." : isEdit ? "Update Bill" : "Add Bill"}
        </button>
      </form>
    </Modal>
  );
};

export default BillFormModal;