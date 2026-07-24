import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { MdSave, MdUploadFile } from "react-icons/md";
import API from "../api/axios.js";
import { fileToBase64 } from "../utils/fileToBase64.js";
import DateInput from "../components/DateInput.jsx";
import { FaArrowLeft } from "react-icons/fa";

const emptyForm = {
  fullName: "",
  email: "",
  phone: "",
  dob: "",
  nationality: "",
  ppsNumber: "",
  idType: "Passport",
  idNumber: "",
  emergencyContactName: "",
  emergencyContactPhone: "",
  currentAddressBeforeMoveIn: "",
  property: "",
  rentScope: "single-room",
  rooms: [],
  sharingWith: [],
  rentAmount: "",
  rentFrequency: "monthly",
  depositAmount: "",
  depositPaid: false,
  moveInDate: "",
  notes: "",
};

const TenantForm = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState({
    ...emptyForm,
    property: searchParams.get("property") || "",
  });
  const [idFile, setIdFile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [existingTenants, setExistingTenants] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get("/properties").then((res) => setProperties(res.data));
  }, []);

  useEffect(() => {
    if (isEdit) {
      API.get(`/tenants/${id}`).then((res) => {
        const t = res.data;
        setForm({
          ...t,
          dob: t.dob ? t.dob.substring(0, 10) : "",
          moveInDate: t.moveInDate ? t.moveInDate.substring(0, 10) : "",
          property: t.property?._id,
          sharingWith: t.sharingWith?.map((s) => s._id) || [],
        });
      });
    }
  }, [id]);

  useEffect(() => {
    if (form.property) {
      API.get(`/tenants`, { params: { property: form.property } }).then((res) =>
        setExistingTenants(res.data.filter((t) => t._id !== id))
      );
    }
  }, [form.property]);

  const selectedProperty = properties.find((p) => p._id === form.property);

  const toggleRoom = (roomNumber) => {
    setForm((prev) => ({
      ...prev,
      rooms: prev.rooms.includes(roomNumber)
        ? prev.rooms.filter((r) => r !== roomNumber)
        : [...prev.rooms, roomNumber],
    }));
  };

  const toggleSharing = (tenantId) => {
    setForm((prev) => ({
      ...prev,
      sharingWith: prev.sharingWith.includes(tenantId)
        ? prev.sharingWith.filter((t) => t !== tenantId)
        : [...prev.sharingWith, tenantId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      const payload = { ...form };

      if (idFile) {
        const base64 = await fileToBase64(idFile);
        payload.idDocument = {
          data: base64,
          contentType: idFile.type,
          fileName: idFile.name,
        };
      }

      if (isEdit) {
        await API.put(`/tenants/${id}`, payload);
      } else {
        await API.post("/tenants", payload);
      }
      navigate(`/tenants`);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="max-w-3xl">
      {/* Back Button */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/tenants")}
          className="flex items-center gap-1 cursor-pointer text-brand-600 hover:text-brand-700 text-sm"
        >
          <FaArrowLeft /> Back to Rent Members
        </button>
      </div>

      <h2 className="text-xl font-bold text-gray-800 mb-6">
        {isEdit ? "Edit Rent Member" : "Add Rent Member"}
      </h2>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-sand-200 p-6 flex flex-col gap-6">
        {/* Personal Details */}
        <section>
          <h3 className="font-semibold text-brand-700 mb-3">Personal Details</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input required placeholder="Full Name" value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Phone" value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <input type="email" placeholder="Email" value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <DateInput value={form.dob} onChange={(iso) => setForm({ ...form, dob: iso })} />
            <input placeholder="Nationality" value={form.nationality}
              onChange={(e) => setForm({ ...form, nationality: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="PPS Number (Ireland)" value={form.ppsNumber}
              onChange={(e) => setForm({ ...form, ppsNumber: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <select value={form.idType} onChange={(e) => setForm({ ...form, idType: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
              <option>Passport</option>
              <option>Driving License</option>
              <option>National ID</option>
              <option>Other</option>
            </select>
            <input placeholder="ID Number" value={form.idNumber}
              onChange={(e) => setForm({ ...form, idNumber: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-brand-600 mt-3 cursor-pointer w-fit">
            <MdUploadFile /> {idFile ? idFile.name : "Upload ID Document (image/PDF)"}
            <input type="file" accept="image/*,application/pdf" className="hidden"
              onChange={(e) => setIdFile(e.target.files[0])} />
          </label>
          {isEdit && form.idDocument?.fileName && !idFile && (
            <p className="text-xs text-gray-500 mt-1">Current file: {form.idDocument.fileName}</p>
          )}
        </section>

        {/* Emergency Contact */}
        <section>
          <h3 className="font-semibold text-brand-700 mb-3">Emergency Contact</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Emergency Contact Name" value={form.emergencyContactName}
              onChange={(e) => setForm({ ...form, emergencyContactName: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <input placeholder="Emergency Contact Phone" value={form.emergencyContactPhone}
              onChange={(e) => setForm({ ...form, emergencyContactPhone: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <input placeholder="Address before move-in (optional)" value={form.currentAddressBeforeMoveIn}
            onChange={(e) => setForm({ ...form, currentAddressBeforeMoveIn: e.target.value })}
            className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full mt-3" />
        </section>

        {/* Property / Room Assignment */}
        <section>
          <h3 className="font-semibold text-brand-700 mb-3">Property & Room Assignment</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <select required value={form.property}
              onChange={(e) => setForm({ ...form, property: e.target.value, rooms: [] })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
              <option value="">Select Property</option>
              {properties.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <select value={form.rentScope}
              onChange={(e) => setForm({ ...form, rentScope: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
              <option value="single-room">Single Room</option>
              <option value="multi-room">Multiple Rooms</option>
              <option value="full-property">Full Property</option>
            </select>
          </div>

          {selectedProperty && form.rentScope !== "full-property" && (
            <div>
              <p className="text-xs text-gray-500 mb-2">Select room(s):</p>
              <div className="flex flex-wrap gap-2">
                {selectedProperty.rooms.map((r) => (
                  <button
                    type="button"
                    key={r._id}
                    onClick={() => toggleRoom(r.roomNumber)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      form.rooms.includes(r.roomNumber)
                        ? "bg-brand-600 text-white border-brand-600"
                        : "border-sand-200 text-gray-600 hover:bg-sand-50"
                    }`}
                  >
                    Room {r.roomNumber}
                  </button>
                ))}
              </div>
            </div>
          )}

          {existingTenants.length > 0 && form.rentScope === "single-room" && (
            <div className="mt-4">
              <p className="text-xs text-gray-500 mb-2">
                Sharing room with existing member(s)? (rent & bills will be split)
              </p>
              <div className="flex flex-wrap gap-2">
                {existingTenants.map((t) => (
                  <button
                    type="button"
                    key={t._id}
                    onClick={() => toggleSharing(t._id)}
                    className={`px-3 py-1.5 rounded-lg text-sm border ${
                      form.sharingWith.includes(t._id)
                        ? "bg-brand-600 text-white border-brand-600"
                        : "border-sand-200 text-gray-600 hover:bg-sand-50"
                    }`}
                  >
                    {t.fullName}
                  </button>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Rent & Deposit */}
        <section>
          <h3 className="font-semibold text-brand-700 mb-3">Rent & Deposit</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input required type="number" step="0.01" min="0" placeholder="Rent Amount (€)" value={form.rentAmount}
              onChange={(e) => setForm({ ...form, rentAmount: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <select value={form.rentFrequency}
              onChange={(e) => setForm({ ...form, rentFrequency: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
              <option value="monthly">Monthly</option>
              <option value="weekly">Weekly</option>
            </select>
            <input type="number" step="0.01" min="0" placeholder="Deposit / Advance (€)" value={form.depositAmount}
              onChange={(e) => setForm({ ...form, depositAmount: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600 mt-3">
            <input type="checkbox" checked={form.depositPaid}
              onChange={(e) => setForm({ ...form, depositPaid: e.target.checked })} />
            Deposit has been paid by this member
          </label>
          <div className="mt-3">
            <label className="text-xs text-gray-500">Move-in Date</label>
            <DateInput required value={form.moveInDate} onChange={(iso) => setForm({ ...form, moveInDate: iso })} />
          </div>
        </section>

        <textarea placeholder="Notes (optional)" value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          className="border border-sand-200 rounded-lg px-3 py-2 text-sm" rows={2} />

        <button type="submit" className="flex items-center justify-center gap-2 bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2.5 font-medium">
          <MdSave /> {isEdit ? "Update Rent Member" : "Add Rent Member"}
        </button>
      </form>
    </div>
  );
};

export default TenantForm;
