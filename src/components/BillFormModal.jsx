import { useState } from "react";
import { MdUploadFile } from "react-icons/md";
import API from "../api/axios.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import Modal from "./Modal.jsx";

const BillFormModal = ({ tenant, onClose, onSaved }) => {
  const shareGroup = [tenant, ...(tenant.sharingWith || [])];

  const [billType, setBillType] = useState("Electricity");
  const [totalAmount, setTotalAmount] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [splitEqually, setSplitEqually] = useState(shareGroup.length > 1);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const amount = Number(totalAmount);
      const shareAmount = splitEqually ? Math.round((amount / shareGroup.length) * 100) / 100 : amount;

      const tenantsPayload = splitEqually
        ? shareGroup.map((t) => ({ tenant: t._id, shareAmount }))
        : [{ tenant: tenant._id, shareAmount: amount }];

      const payload = {
        property: tenant.property?._id || tenant.property,
        billType,
        totalAmount: amount,
        billDate,
        dueDate: dueDate || undefined,
        tenants: tenantsPayload,
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
    <Modal title="Add Bill" onClose={onClose}>
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <select value={billType} onChange={(e) => setBillType(e.target.value)}
          className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
          <option>Electricity</option>
          <option>Gas</option>
          <option>Internet</option>
          <option>Water</option>
          <option>Other</option>
        </select>
        <input required type="number" min="0" placeholder="Total Amount (€)" value={totalAmount}
          onChange={(e) => setTotalAmount(e.target.value)}
          className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
        <div className="grid grid-cols-2 gap-3">
          <input required type="date" value={billDate} onChange={(e) => setBillDate(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
          <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
        </div>

        {shareGroup.length > 1 && (
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={splitEqually} onChange={(e) => setSplitEqually(e.target.checked)} />
            Split equally between {shareGroup.map((t) => t.fullName).join(" & ")}
          </label>
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
