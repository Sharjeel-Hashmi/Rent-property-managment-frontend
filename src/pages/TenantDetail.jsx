import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MdEdit, MdDelete, MdReceiptLong, MdAdd, MdWarningAmber,
  MdCheckCircle, MdLogout, MdAttachFile, MdHome,
} from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import BillFormModal from "../components/BillFormModal.jsx";
import MonthSelector from "../components/MonthSelector.jsx";

const getCurrentMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [noticeForm, setNoticeForm] = useState({ noticeGivenDate: "", plannedMoveOutDate: "" });
  const [moveOutForm, setMoveOutForm] = useState({ moveOutDate: "", deductionAmount: "", deductionNote: "" });

  const [rentMonth, setRentMonth] = useState(getCurrentMonth());
  const [rentPayment, setRentPayment] = useState(null);
  const [rentLoading, setRentLoading] = useState(false);

  const fetchData = async () => {
    const { data } = await API.get(`/tenants/${id}`);
    setTenant(data);
    const billsRes = await API.get("/bills", { params: { tenant: id } });
    setBills(billsRes.data);
  };

  const fetchRentPayment = async () => {
    setRentLoading(true);
    try {
      const { data } = await API.get("/rent-payments", { params: { tenant: id, month: rentMonth } });
      setRentPayment(data);
    } finally {
      setRentLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    fetchRentPayment();
  }, [id, rentMonth]);

  const toggleRentPaid = async () => {
    const { data } = await API.put(`/rent-payments/${rentPayment._id}/toggle`);
    setRentPayment(data);
  };

  const toggleBillPaid = async (billId) => {
    const { data } = await API.put(`/bills/${billId}/pay`);
    setBills((prev) => prev.map((b) => (b._id === billId ? data : b)));
  };

  const handleGiveNotice = async (e) => {
    e.preventDefault();
    await API.put(`/tenants/${id}/notice`, noticeForm);
    setShowNoticeModal(false);
    fetchData();
  };

  const handleMoveOut = async (e) => {
    e.preventDefault();
    await API.put(`/tenants/${id}/move-out`, moveOutForm);
    setShowMoveOutModal(false);
    fetchData();
  };

  const handleDelete = async () => {
    await API.delete(`/tenants/${id}`);
    navigate("/tenants");
  };

  if (!tenant) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl">
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{tenant.fullName}</h2>
          <p className="text-sm text-gray-500">
            {tenant.property?.name} · Room(s): {tenant.rooms.join(", ") || "Full property"}
          </p>
          <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
            tenant.status === "active" ? "bg-brand-50 text-brand-700" :
            tenant.status === "notice-given" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
          }`}>
            {tenant.status}
          </span>
        </div>
        <div className="flex gap-2">
          <Link to={`/tenants/${id}/edit`} className="flex items-center gap-1 text-sm border border-sand-200 px-3 py-1.5 rounded-lg hover:bg-sand-50">
            <MdEdit size={16} /> Edit
          </Link>
          <button onClick={() => setConfirmDelete(true)} className="flex items-center gap-1 text-sm border border-red-200 text-red-500 px-3 py-1.5 rounded-lg hover:bg-red-50">
            <MdDelete size={16} /> Delete
          </button>
        </div>
      </div>

      {/* Notice period alert */}
      {tenant.status === "notice-given" && (
        <div className={`rounded-xl p-4 mb-6 flex items-start gap-3 ${
          tenant.deductionApplicable ? "bg-amber-50 border border-amber-200" : "bg-brand-50 border border-brand-200"
        }`}>
          <MdWarningAmber className={tenant.deductionApplicable ? "text-amber-600" : "text-brand-600"} size={22} />
          <div className="text-sm">
            <p className="font-medium text-gray-800">
              Notice given on {new Date(tenant.noticeGivenDate).toLocaleDateString()}, planned move-out {new Date(tenant.plannedMoveOutDate).toLocaleDateString()}
            </p>
            <p className="text-gray-600">
              Required notice: {tenant.requiredNoticeWeeks} weeks. Shortfall: {tenant.noticeShortfallDays} day(s).
            </p>
            {tenant.deductionApplicable && (
              <p className="text-amber-700 font-medium mt-1">
                Shortfall exceeds 15 days — advance payment deduction applies at move-out.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Actions */}
      {tenant.status !== "moved-out" && (
        <div className="flex gap-3 mb-6">
          {tenant.status === "active" && (
            <button onClick={() => setShowNoticeModal(true)}
              className="flex items-center gap-1 text-sm bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg">
              <MdWarningAmber size={16} /> Give Notice
            </button>
          )}
          <button onClick={() => setShowMoveOutModal(true)}
            className="flex items-center gap-1 text-sm bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-lg">
            <MdLogout size={16} /> Finalize Move-Out
          </button>
        </div>
      )}

      {/* Personal Info */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5 mb-6">
        <h3 className="font-semibold text-brand-700 mb-3">Personal & ID Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-2 text-sm text-gray-700">
          <p><span className="text-gray-400">Phone:</span> {tenant.phone}</p>
          <p><span className="text-gray-400">Email:</span> {tenant.email || "-"}</p>
          <p><span className="text-gray-400">PPS Number:</span> {tenant.ppsNumber || "-"}</p>
          <p><span className="text-gray-400">ID:</span> {tenant.idType} {tenant.idNumber}</p>
          <p><span className="text-gray-400">Nationality:</span> {tenant.nationality || "-"}</p>
          <p><span className="text-gray-400">Emergency Contact:</span> {tenant.emergencyContactName} {tenant.emergencyContactPhone}</p>
          <p><span className="text-gray-400">Move-in Date:</span> {new Date(tenant.moveInDate).toLocaleDateString()}</p>
          <p><span className="text-gray-400">Rent:</span> €{tenant.rentAmount}/{tenant.rentFrequency}</p>
          <p><span className="text-gray-400">Deposit:</span> €{tenant.depositAmount}</p>
          {tenant.sharingWith?.length > 0 && (
            <p><span className="text-gray-400">Sharing room with:</span> {tenant.sharingWith.map((s) => s.fullName).join(", ")}</p>
          )}
        </div>
        {tenant.idDocument?.data && (
          <a
            href={`data:${tenant.idDocument.contentType};base64,${tenant.idDocument.data}`}
            download={tenant.idDocument.fileName}
            className="flex items-center gap-1 text-brand-600 text-sm mt-3 hover:underline w-fit"
          >
            <MdAttachFile size={16} /> {tenant.idDocument.fileName}
          </a>
        )}
      </div>

      {/* Monthly Rent */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="font-semibold text-brand-700 flex items-center gap-2">
            <MdHome /> Monthly Rent
          </h3>
          <MonthSelector value={rentMonth} onChange={setRentMonth} />
        </div>

        {rentLoading || !rentPayment ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <div className="flex items-center justify-between border border-sand-200 rounded-lg p-4">
            <div>
              <p className="font-medium text-gray-800">Rent — €{rentPayment.amount}</p>
              <p className="text-xs text-gray-500">
                {rentPayment.isPaid && rentPayment.paidDate
                  ? `Paid on ${new Date(rentPayment.paidDate).toLocaleDateString()}`
                  : "Not paid yet"}
              </p>
            </div>
            <button
              onClick={toggleRentPaid}
              className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium ${
                rentPayment.isPaid
                  ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {rentPayment.isPaid && <MdCheckCircle size={14} />}
              {rentPayment.isPaid ? "Paid" : "Mark as Paid"}
            </button>
          </div>
        )}
      </div>

      {/* Bills */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-brand-700 flex items-center gap-2">
            <MdReceiptLong /> Bills
          </h3>
          <button onClick={() => setShowBillModal(true)} className="flex items-center gap-1 text-sm text-brand-600 hover:text-brand-700">
            <MdAdd size={16} /> Add Bill
          </button>
        </div>
        <div className="flex flex-col gap-2">
          {bills.map((b) => {
            const share = b.tenants.find((t) => t.tenant?._id === id);
            return (
              <div key={b._id} className="flex items-center justify-between border border-sand-200 rounded-lg p-3 text-sm">
                <div>
                  <p className="font-medium text-gray-800">{b.billType} — €{share?.shareAmount ?? b.totalAmount}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(b.billDate).toLocaleDateString()}
                    {b.tenants.length > 1 && ` · split among ${b.tenants.length}`}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  {b.attachment?.data && (
                    <a href={`data:${b.attachment.contentType};base64,${b.attachment.data}`}
                      download={b.attachment.fileName} className="text-brand-600 hover:underline flex items-center gap-1">
                      <MdAttachFile size={16} />
                    </a>
                  )}
                  <button
                    onClick={() => toggleBillPaid(b._id)}
                    className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium ${
                      b.isPaid ? "bg-brand-50 text-brand-700 hover:bg-brand-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {b.isPaid && <MdCheckCircle size={12} />} {b.isPaid ? "Paid" : "Mark as Paid"}
                  </button>
                </div>
              </div>
            );
          })}
          {bills.length === 0 && <p className="text-sm text-gray-500">No bills recorded yet.</p>}
        </div>
      </div>

      {showNoticeModal && (
        <Modal title="Give Notice" onClose={() => setShowNoticeModal(false)}>
          <form onSubmit={handleGiveNotice} className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-gray-600">Notice Given Date</label>
              <input required type="date" value={noticeForm.noticeGivenDate}
                onChange={(e) => setNoticeForm({ ...noticeForm, noticeGivenDate: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full mt-1" />
            </div>
            <div>
              <label className="text-sm text-gray-600">Planned Move-Out Date</label>
              <input required type="date" value={noticeForm.plannedMoveOutDate}
                onChange={(e) => setNoticeForm({ ...noticeForm, plannedMoveOutDate: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full mt-1" />
            </div>
            <p className="text-xs text-gray-500">
              Required notice period is 4 weeks. If the gap between these dates falls more than 15 days short of that, a deduction from the advance payment will be flagged automatically.
            </p>
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-white rounded-lg py-2 text-sm font-medium mt-2">
              Confirm Notice
            </button>
          </form>
        </Modal>
      )}

      {showMoveOutModal && (
        <Modal title="Finalize Move-Out" onClose={() => setShowMoveOutModal(false)}>
          <form onSubmit={handleMoveOut} className="flex flex-col gap-3">
            <div>
              <label className="text-sm text-gray-600">Move-Out Date</label>
              <input required type="date" value={moveOutForm.moveOutDate}
                onChange={(e) => setMoveOutForm({ ...moveOutForm, moveOutDate: e.target.value })}
                className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full mt-1" />
            </div>
            {tenant.deductionApplicable && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Deduction Amount (€)</label>
                  <input type="number" min="0" value={moveOutForm.deductionAmount}
                    onChange={(e) => setMoveOutForm({ ...moveOutForm, deductionAmount: e.target.value })}
                    className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full mt-1" />
                </div>
                <div>
                  <label className="text-sm text-gray-600">Deduction Note</label>
                  <input value={moveOutForm.deductionNote}
                    onChange={(e) => setMoveOutForm({ ...moveOutForm, deductionNote: e.target.value })}
                    className="border border-sand-200 rounded-lg px-3 py-2 text-sm w-full mt-1" />
                </div>
              </>
            )}
            <button type="submit" className="bg-gray-700 hover:bg-gray-800 text-white rounded-lg py-2 text-sm font-medium mt-2">
              Confirm Move-Out
            </button>
          </form>
        </Modal>
      )}

      {showBillModal && (
        <BillFormModal
          tenant={tenant}
          onClose={() => setShowBillModal(false)}
          onSaved={() => { setShowBillModal(false); fetchData(); }}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Delete this rent member? This cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  );
};

export default TenantDetail;
