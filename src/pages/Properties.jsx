import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MdAdd, MdEdit, MdDelete, MdApartment, MdArrowForward } from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";

const emptyForm = {
  name: "",
  address: "",
  county: "",
  eircode: "",
  totalRooms: 1,
  rentType: "room-wise",
  description: "",
};

const Properties = () => {
  const [properties, setProperties] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState(null);
  const [error, setError] = useState("");

  const fetchProperties = async () => {
    const { data } = await API.get("/properties");
    setProperties(data);
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const openAdd = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (property) => {
    setEditing(property);
    setForm({
      name: property.name,
      address: property.address,
      county: property.county || "",
      eircode: property.eircode || "",
      totalRooms: property.totalRooms,
      rentType: property.rentType,
      description: property.description || "",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (editing) {
        await API.put(`/properties/${editing._id}`, form);
      } else {
        await API.post("/properties", form);
      }
      setShowModal(false);
      fetchProperties();
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    }
  };

  const handleDelete = async () => {
    try {
      await API.delete(`/properties/${deleteId}`);
      setDeleteId(null);
      fetchProperties();
    } catch (err) {
      alert(err.response?.data?.message || "Could not delete property");
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">Properties</h2>
        <button
          onClick={openAdd}
          className="flex items-center gap-1 bg-brand-600 hover:bg-brand-700 text-white text-sm px-4 py-2 rounded-lg"
        >
          <MdAdd size={18} /> Add Property
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {properties.map((p) => {
          const occupied = p.rooms.filter((r) => r.status === "occupied").length;
          return (
            <div key={p._id} className="bg-white rounded-xl shadow-sm border border-sand-200 overflow-hidden">
              <div className="bg-brand-50 h-20 flex items-center justify-center">
                <MdApartment size={36} className="text-brand-500" />
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-gray-800">{p.name}</h3>
                <p className="text-sm text-gray-500 mb-2">{p.address}{p.county ? `, ${p.county}` : ""}</p>
                <p className="text-xs text-gray-500 mb-3">
                  Rooms occupied: <span className="font-medium text-brand-700">{occupied}/{p.rooms.length}</span>
                </p>
                <div className="flex items-center justify-between">
                  <Link
                    to={`/properties/${p._id}`}
                    className="text-sm text-brand-600 font-medium flex items-center gap-1 hover:underline"
                  >
                    View details <MdArrowForward size={16} />
                  </Link>
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-brand-600">
                      <MdEdit size={18} />
                    </button>
                    <button onClick={() => setDeleteId(p._id)} className="text-gray-400 hover:text-red-500">
                      <MdDelete size={18} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {properties.length === 0 && (
          <p className="text-gray-500 col-span-full">No properties added yet.</p>
        )}
      </div>

      {showModal && (
        <Modal title={editing ? "Edit Property" : "Add Property"} onClose={() => setShowModal(false)}>
          {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <input required placeholder="Property Name" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <input required placeholder="Address" value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="County" value={form.county}
                onChange={(e) => setForm({ ...form, county: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
              <input placeholder="Eircode" value={form.eircode}
                onChange={(e) => setForm({ ...form, eircode: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <input required type="number" min="1" placeholder="Total Rooms" value={form.totalRooms}
                onChange={(e) => setForm({ ...form, totalRooms: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
              <select value={form.rentType}
                onChange={(e) => setForm({ ...form, rentType: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm">
                <option value="room-wise">Room-wise Rent</option>
                <option value="full-property">Full Property Only</option>
              </select>
            </div>
            <textarea placeholder="Description (optional)" value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" rows={2} />
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium mt-2">
              {editing ? "Update Property" : "Add Property"}
            </button>
          </form>
        </Modal>
      )}

      {deleteId && (
        <ConfirmDialog
          message="Delete this property? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}
    </div>
  );
};

export default Properties;
