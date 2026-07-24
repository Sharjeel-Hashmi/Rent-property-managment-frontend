import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  MdAdd, MdEdit, MdDelete, MdMeetingRoom, MdPerson,
  MdReceiptLong, MdCheckCircle, MdAttachFile,
} from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import BillFormModal from "../components/BillFormModal.jsx";

const emptyRoom = { roomNumber: "", capacity: 1, notes: "" };
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-"); // dd/mm/yyyy

const PropertyDetail = () => {
  const { id } = useParams();
  const [property, setProperty] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [bills, setBills] = useState([]);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState(emptyRoom);
  const [deleteRoomId, setDeleteRoomId] = useState(null);
  const [showBillModal, setShowBillModal] = useState(false);
  const [deleteBillId, setDeleteBillId] = useState(null);

  const fetchData = async () => {
    const { data } = await API.get(`/properties/${id}`);
    setProperty(data.property);
    setTenants(data.tenants);
  };

  const fetchBills = async () => {
    const { data } = await API.get("/bills", { params: { property: id } });
    setBills(data);
  };

  useEffect(() => {
    fetchData();
    fetchBills();
  }, [id]);

  const openAddRoom = () => {
    setEditingRoom(null);
    setRoomForm(emptyRoom);
    setShowRoomModal(true);
  };

  const openEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({ roomNumber: room.roomNumber, capacity: room.capacity, notes: room.notes || "" });
    setShowRoomModal(true);
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();
    if (editingRoom) {
      await API.put(`/properties/${id}/rooms/${editingRoom._id}`, roomForm);
    } else {
      await API.post(`/properties/${id}/rooms`, roomForm);
    }
    setShowRoomModal(false);
    fetchData();
  };

  const handleDeleteRoom = async () => {
    await API.delete(`/properties/${id}/rooms/${deleteRoomId}`);
    setDeleteRoomId(null);
    fetchData();
  };

  const toggleTenantPaid = async (billId, tenantId) => {
    const { data } = await API.put(`/bills/${billId}/pay/${tenantId}`);
    setBills((prev) => prev.map((b) => (b._id === billId ? data : b)));
  };

  const handleDeleteBill = async () => {
    await API.delete(`/bills/${deleteBillId}`);
    setDeleteBillId(null);
    fetchBills();
  };

  if (!property) return <p className="text-gray-500">Loading...</p>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">{property.name}</h2>
        <p className="text-sm text-gray-500">{property.address}{property.county ? `, ${property.county}` : ""} {property.eircode}</p>
      </div>

      {/* Rooms Section */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <MdMeetingRoom /> Rooms
          </h3>
          <button
            onClick={openAddRoom}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            <MdAdd size={16} /> Add Room
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {property.rooms.map((room) => (
            <div key={room._id} className="border border-sand-200 rounded-lg p-3 flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-800">Room {room.roomNumber}</p>
                <p className="text-xs text-gray-500">Capacity: {room.capacity}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  room.status === "occupied" ? "bg-red-50 text-red-600" : "bg-brand-50 text-brand-700"
                }`}>
                  {room.status}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditRoom(room)} className="text-gray-400 hover:text-brand-600">
                  <MdEdit size={16} />
                </button>
                <button onClick={() => setDeleteRoomId(room._id)} className="text-gray-400 hover:text-red-500">
                  <MdDelete size={16} />
                </button>
              </div>
            </div>
          ))}
          {property.rooms.length === 0 && <p className="text-sm text-gray-500">No rooms added yet.</p>}
        </div>
      </div>

      {/* Tenants Section */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <MdPerson /> Rent Members
          </h3>
          <Link
            to={`/tenants/new?property=${id}`}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            <MdAdd size={16} /> Add Rent Member
          </Link>
        </div>

        <div className="flex flex-col gap-2">
          {tenants.map((t) => (
            <Link
              key={t._id}
              to={`/tenants/${t._id}`}
              className="flex items-center justify-between border border-sand-200 rounded-lg p-3 hover:bg-sand-50"
            >
              <div>
                <p className="font-medium text-gray-800">{t.fullName}</p>
                <p className="text-xs text-gray-500">
                  Rooms: {t.rooms.join(", ") || "-"} · €{t.rentAmount}/{t.rentFrequency}
                </p>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                t.status === "active" ? "bg-brand-50 text-brand-700" :
                t.status === "notice-given" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
              }`}>
                {t.status}
              </span>
            </Link>
          ))}
          {tenants.length === 0 && <p className="text-sm text-gray-500">No rent members yet.</p>}
        </div>
      </div>

      {/* Bills Section */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-700 flex items-center gap-2">
            <MdReceiptLong /> Bills
          </h3>
          <button
            onClick={() => setShowBillModal(true)}
            className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700"
          >
            <MdAdd size={16} /> Add Bill
          </button>
        </div>

        <div className="flex flex-col gap-2">
          {bills.map((b) => {
            const paidCount = b.tenants.filter((t) => t.isPaid).length;
            return (
              <div key={b._id} className="border border-sand-200 rounded-lg p-3 text-sm">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-gray-800">{b.billType} — €{b.totalAmount}</p>
                    <p className="text-xs text-gray-500">
                      {b.billPeriodStart && b.billPeriodEnd
                        ? `${fmtDate(b.billPeriodStart)} - ${fmtDate(b.billPeriodEnd)}`
                        : fmtDate(b.billDate)}
                      {" · "}{paidCount}/{b.tenants.length} Paid
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {b.attachment?.data && (
                      <a href={`data:${b.attachment.contentType};base64,${b.attachment.data}`}
                        download={b.attachment.fileName} className="text-brand-600 hover:underline flex items-center gap-1">
                        <MdAttachFile size={16} />
                      </a>
                    )}
                    <button onClick={() => setDeleteBillId(b._id)} className="text-gray-400 hover:text-red-500">
                      <MdDelete size={16} />
                    </button>
                  </div>
                </div>
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
              </div>
            );
          })}
          {bills.length === 0 && <p className="text-sm text-gray-500">No bills recorded yet for this property.</p>}
        </div>
      </div>

      {showRoomModal && (
        <Modal title={editingRoom ? "Edit Room" : "Add Room"} onClose={() => setShowRoomModal(false)}>
          <form onSubmit={handleRoomSubmit} className="flex flex-col gap-3">
            <input required placeholder="Room Number / Name" value={roomForm.roomNumber}
              onChange={(e) => setRoomForm({ ...roomForm, roomNumber: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <input required type="number" min="1" placeholder="Capacity" value={roomForm.capacity}
              onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" />
            <textarea placeholder="Notes (optional)" value={roomForm.notes}
              onChange={(e) => setRoomForm({ ...roomForm, notes: e.target.value })}
              className="border border-sand-200 rounded-lg px-3 py-2 text-sm" rows={2} />
            <button type="submit" className="bg-brand-600 hover:bg-brand-700 text-white rounded-lg py-2 text-sm font-medium mt-2">
              {editingRoom ? "Update Room" : "Add Room"}
            </button>
          </form>
        </Modal>
      )}

      {deleteRoomId && (
        <ConfirmDialog
          message="Delete this room?"
          onConfirm={handleDeleteRoom}
          onCancel={() => setDeleteRoomId(null)}
        />
      )}

      {showBillModal && (
        <BillFormModal
          propertyId={id}
          onClose={() => setShowBillModal(false)}
          onSaved={() => { setShowBillModal(false); fetchBills(); }}
        />
      )}

      {deleteBillId && (
        <ConfirmDialog
          message="Delete this bill?"
          onConfirm={handleDeleteBill}
          onCancel={() => setDeleteBillId(null)}
        />
      )}
    </div>
  );
};

export default PropertyDetail;