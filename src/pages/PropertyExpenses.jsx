import { useEffect, useState } from "react";
import { MdAdd, MdPayments, MdAttachFile, MdDelete } from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import DateInput from "../components/DateInput.jsx";
import { fileToBase64 } from "../utils/fileToBase64.js";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const emptyForm = { property: "", title: "", detail: "", amount: "", date: "" };

const PropertyExpenses = () => {
  const [expenses, setExpenses] = useState([]);
  const [properties, setProperties] = useState([]);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [propertyTenants, setPropertyTenants] = useState([]);

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [selectedTenants, setSelectedTenants] = useState([]);
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchExpenses = async () => {
    const { data } = await API.get("/property-expenses", {
      params: propertyFilter ? { property: propertyFilter } : {},
    });
    setExpenses(data);
  };

  useEffect(() => {
    API.get("/properties").then((res) => setProperties(res.data));
  }, []);

  useEffect(() => {
    fetchExpenses();
  }, [propertyFilter]);

  useEffect(() => {
    if (form.property) {
      API.get("/tenants", { params: { property: form.property, status: "active" } }).then((res) => {
        setPropertyTenants(res.data);
        setSelectedTenants(res.data.map((t) => t._id)); // default: split among all active tenants
      });
    } else {
      setPropertyTenants([]);
      setSelectedTenants([]);
    }
  }, [form.property]);

  const openAdd = () => {
    setForm(emptyForm);
    setFile(null);
    setError("");
    setShowModal(true);
  };

  const toggleTenant = (id) => {
    setSelectedTenants((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const shareAmount =
    selectedTenants.length > 0 && form.amount
      ? Math.round((Number(form.amount) / selectedTenants.length) * 100) / 100
      : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = { ...form, amount: Number(form.amount), splitBetween: selectedTenants };

      if (file) {
        const base64 = await fileToBase64(file);
        payload.image = { data: base64, contentType: file.type, fileName: file.name };
      }

      await API.post("/property-expenses", payload);
      setShowModal(false);
      fetchExpenses();
    } catch (err) {
      setError(err.response?.data?.message || "Could not save expense");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    await API.delete(`/property-expenses/${deleteId}`);
    setDeleteId(null);
    fetchExpenses();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <MdPayments /> Property Expenses
        </h2>
        <div className="flex items-center gap-3">
          <select value={propertyFilter} onChange={(e) => setPropertyFilter(e.target.value)}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
            <option value="">All Properties</option>
            {properties.map((p) => (
              <option key={p._id} value={p._id}>{p.name}</option>
            ))}
          </select>
          <button onClick={openAdd} className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg">
            <MdAdd size={18} /> Add Expense
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {expenses.map((exp) => (
          <div key={exp._id} className="bg-white rounded-xl shadow-sm border border-sand-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-800">{exp.title}</p>
                <p className="text-xs text-gray-500">{exp.property?.name} · {fmtDate(exp.date)}</p>
                {exp.detail && <p className="text-sm text-gray-600 mt-1">{exp.detail}</p>}
              </div>
              <div className="flex items-center gap-3">
                <span className="font-medium text-gray-800">€{exp.amount}</span>
                {exp.image?.data && (
                  <a href={`data:${exp.image.contentType};base64,${exp.image.data}`}
                    download={exp.image.fileName} className="text-brand-600 hover:underline">
                    <MdAttachFile size={16} />
                  </a>
                )}
                <button onClick={() => setDeleteId(exp._id)} className="text-gray-400 hover:text-red-500">
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
            {exp.splitBetween?.length > 0 && (
              <div className="mt-3 border-t border-sand-100 pt-2 flex flex-wrap gap-3 text-xs text-gray-500">
                {exp.splitBetween.map((s) => (
                  <span key={s.tenant?._id}>{s.tenant?.fullName}: €{s.shareAmount}</span>
                ))}
              </div>
            )}
          </div>
        ))}
        {expenses.length === 0 && <p className="text-sm text-gray-500">No expenses recorded yet.</p>}
      </div>

      {showModal && (
        <Modal title="Add Property Expense" onClose={() => setShowModal(false)} wide>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <select required value={form.property} onChange={(e) => setForm({ ...form, property: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <input required placeholder="Expense Name (e.g. Property Tax, Maintenance, Electrical Work)" value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Detail (optional)" value={form.detail}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" rows={2} />
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" step="0.01" min="0" placeholder="Amount (€)" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
              <DateInput required value={form.date} onChange={(iso) => setForm({ ...form, date: iso })} />
            </div>

            {propertyTenants.length > 0 && (
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
                {selectedTenants.length > 0 && form.amount && (
                  <p className="text-xs text-gray-500 mt-2">Each selected member pays: <span className="font-medium text-gray-700">€{shareAmount}</span></p>
                )}
              </div>
            )}

            <label className="flex items-center gap-2 text-sm text-brand-600 cursor-pointer w-fit">
              <MdAttachFile /> {file ? file.name : "Attach receipt (image/PDF)"}
              <input type="file" accept="image/*,application/pdf" className="hidden"
                onChange={(e) => setFile(e.target.files[0])} />
            </label>

            <button type="submit" disabled={saving}
              className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium mt-2 disabled:opacity-60">
              {saving ? "Saving..." : "Add Expense"}
            </button>
          </form>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog message="Delete this expense?" onConfirm={handleDelete} onCancel={() => setDeleteId(null)} />
      )}
    </div>
  );
};

export default PropertyExpenses;
