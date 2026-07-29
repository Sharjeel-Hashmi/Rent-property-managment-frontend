import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  MdEdit, MdDelete, MdReceiptLong, MdAdd, MdWarningAmber,
  MdCheckCircle, MdLogout, MdAttachFile, MdHome, MdHistory,
} from "react-icons/md";
import API from "../api/axios.js";
import Modal from "../components/Modal.jsx";
import ConfirmDialog from "../components/ConfirmDialog.jsx";
import BillFormModal from "../components/BillFormModal.jsx";
import DateInput from "../components/DateInput.jsx";
import { FaArrowLeft } from "react-icons/fa";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-"); // dd/mm/yyyy

const TenantDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState(null);
  const [bills, setBills] = useState([]);
  const [currentRentCycle, setCurrentRentCycle] = useState(null);
  const [rentHistory, setRentHistory] = useState([]);

  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showMoveOutModal, setShowMoveOutModal] = useState(false);
  const [showBillModal, setShowBillModal] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [noticeForm, setNoticeForm] = useState({ noticeGivenDate: "", plannedMoveOutDate: "" });
  const [moveOutForm, setMoveOutForm] = useState({ moveOutDate: "", deductionAmount: "", deductionNote: "" });
  const [depositSummary, setDepositSummary] = useState(null);

  const fetchData = async () => {
    const { data } = await API.get(`/tenants/${id}`);
    setTenant(data);
    const billsRes = await API.get("/bills", { params: { tenant: id } });
    setBills(billsRes.data);
  };

  const fetchRent = async () => {
    try {
      const { data } = await API.get(`/rent-payments/current/${id}`);
      setCurrentRentCycle(data);
      const historyRes = await API.get(`/rent-payments/history/${id}`);
      setRentHistory(historyRes.data);
    } catch (err) {
      console.error("Could not load rent info:", err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchRent();
  }, [id]);

  // Toggles any single rent cycle's paid status by id — used for both the
  // current-cycle card and individual Rent History rows. Only the clicked
  // record changes; other months are left untouched.
  const toggleRentPaidById = async (rentId) => {
    try {
      const { data } = await API.put(`/rent-payments/${rentId}/toggle`);
      if (currentRentCycle?._id === data._id) setCurrentRentCycle(data);
      await fetchRent();
    } catch (err) {
      console.error("Rent toggle failed:", err);
      alert(err.response?.data?.message || "Rent status update nahi ho saka. Dobara try karein.");
    }
  };

  const toggleBillPaid = async (billId) => {
    const { data } = await API.put(`/bills/${billId}/pay/${id}`);
    setBills((prev) => prev.map((b) => (b._id === billId ? data : b)));
  };

  const handleGiveNotice = async (e) => {
    e.preventDefault();
    await API.put(`/tenants/${id}/notice`, noticeForm);
    setShowNoticeModal(false);
    fetchData();
  };

  const openMoveOutModal = async () => {
    try {
      const { data } = await API.get(`/tenants/${id}/deposit-summary`);
      setDepositSummary(data);
      setMoveOutForm({
        moveOutDate: "",
        deductionAmount: data.shortfallPenalty || "",
        deductionNote: "",
      });
      setShowMoveOutModal(true);
    } catch (err) {
      console.error("Could not load deposit summary:", err);
      alert(err.response?.data?.message || "Deposit summary load nahi ho saka. Dobara try karein.");
    }
  };

  const handleMoveOut = async (e) => {
    e.preventDefault();
    try {
      await API.put(`/tenants/${id}/move-out`, moveOutForm);
      setShowMoveOutModal(false);
      fetchData();
    } catch (err) {
      console.error("Move-out failed:", err);
      alert(err.response?.data?.message || "Move-out finalize nahi ho saka. Dobara try karein.");
    }
  };

  const handleDelete = async () => {
    await API.delete(`/tenants/${id}`);
    navigate("/tenants");
  };

  const handleToggleDeposit = async () => {
    try {
      const { data } = await API.put(`/tenants/${id}/toggle-deposit`);
      setTenant(data);
    } catch (err) {
      console.error("Deposit toggle failed:", err);
      alert(err.response?.data?.message || "Deposit status update nahi ho saka. Dobara try karein.");
    }
  };

  if (!tenant) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl">
     {/* back button */}
           <div className="mb-6">
             <button
               onClick={() => navigate(-1)}
               className="flex items-center gap-1 cursor-pointer text-brand-600 hover:text-brand-700 text-sm"
             >
               <FaArrowLeft /> Back to Property Details
             </button>
           </div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-gray-800">{tenant.fullName}</h2>
          <p className="text-sm text-gray-500">
            {tenant.property?.name} · Room(s): {tenant.rooms.join(", ") || "Full property"}
          </p>
          <div className="flex gap-2 mt-1">
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              tenant.status === "active" ? "bg-brand-50 text-brand-700" :
              tenant.status === "notice-given" ? "bg-amber-50 text-amber-700" : "bg-gray-100 text-gray-500"
            }`}>
              {tenant.status}
            </span>
            <button
              onClick={handleToggleDeposit}
              title="Click to toggle deposit paid status"
              className={`text-xs px-2 py-0.5 rounded-full cursor-pointer hover:opacity-80 ${
                tenant.depositPaid ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
              }`}>
              Deposit {tenant.depositPaid ? "Paid" : "Not Paid"}
            </button>
          </div>
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
              Notice given on {fmtDate(tenant.noticeGivenDate)}, planned move-out {fmtDate(tenant.plannedMoveOutDate)}
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

      {tenant.status === "moved-out" && tenant.remainingDepositAmount !== undefined && (
        <div className="rounded-xl p-4 mb-6 bg-sand-100 border border-sand-200 text-sm">
          <p className="font-medium text-gray-800">Moved out on {fmtDate(tenant.moveOutDate)}</p>
          <p className="text-gray-600">Final remaining deposit refunded: €{tenant.remainingDepositAmount}</p>
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
          <button onClick={openMoveOutModal}
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
          <p><span className="text-gray-400">Move-in Date:</span> {fmtDate(tenant.moveInDate)}</p>
          <p><span className="text-gray-400">Rent:</span> €{tenant.rentAmount}/{tenant.rentFrequency}</p>
          <p>
            <span className="text-gray-400">Deposit:</span> €{tenant.depositAmount} ({tenant.depositPaid ? "Paid" : "Not Paid"})
            {tenant.depositPaid && tenant.depositPaidDate && (
              <span className="text-gray-400"> on {fmtDate(tenant.depositPaidDate)}</span>
            )}
          </p>
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

      {/* Current Rent Due */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5 mb-6">
        <h3 className="font-semibold text-brand-700 flex items-center gap-2 mb-4">
          <MdHome /> Rent
        </h3>
        {tenant.status !== "moved-out" && currentRentCycle && (
          <div className={`flex items-center justify-between border rounded-lg p-4 ${
            !currentRentCycle.isPaid && new Date(currentRentCycle.dueDate) < new Date()
              ? "border-red-200 bg-red-50"
              : "border-sand-200"
          }`}>
            <div>
              <p className="font-medium text-gray-800">Rent — €{currentRentCycle.amount}</p>
              <p className="text-xs text-gray-500">
                Due date: {fmtDate(currentRentCycle.dueDate)}
                {currentRentCycle.isPaid && currentRentCycle.paidDate && ` · Paid on ${fmtDate(currentRentCycle.paidDate)}`}
              </p>
            </div>
            <button
              onClick={() => toggleRentPaidById(currentRentCycle._id)}
              className={`text-xs px-3 py-1.5 rounded-full flex items-center gap-1 font-medium ${
                currentRentCycle.isPaid
                  ? "bg-brand-50 text-brand-700 hover:bg-brand-100"
                  : "bg-red-50 text-red-600 hover:bg-red-100"
              }`}
            >
              {currentRentCycle.isPaid && <MdCheckCircle size={14} />}
              {currentRentCycle.isPaid ? "Paid" : "Mark as Paid"}
            </button>
          </div>
        )}

        {tenant.status === "moved-out" && (
          <p className="text-sm text-gray-500 mb-4">Tenant has moved out — no active rent cycle.</p>
        )}

        {/* Rent History */}
        <div className="mt-4">
          <p className="text-xs text-gray-500 flex items-center gap-1 mb-2"><MdHistory size={14} /> Rent History</p>
          <div className="max-h-64 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 text-left">
                  <th className="py-1 font-normal">Due Date</th>
                  <th className="py-1 font-normal">Paid Date</th>
                  <th className="py-1 font-normal">Amount</th>
                  <th className="py-1 font-normal">Status</th>
                </tr>
              </thead>
              <tbody>
                {rentHistory.map((r) => (
                  <tr key={r._id} className="border-t border-sand-100">
                    <td className="py-2 text-gray-600">{fmtDate(r.dueDate)}</td>
                    <td className="py-2 text-gray-600">{r.isPaid ? fmtDate(r.paidDate) : "-"}</td>
                    <td className="py-2 text-gray-700">€{r.amount}</td>
                    <td className="py-2">
                      {tenant.status === "moved-out" ? (
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.isPaid ? "bg-brand-50 text-brand-700" : "bg-red-50 text-red-600"
                        }`}>
                          {r.isPaid ? "Paid" : "Unpaid"}
                        </span>
                      ) : (
                      <button
                        onClick={() => toggleRentPaidById(r._id)}
                        title={r.isPaid ? "Click to mark this month unpaid" : "Click to mark this month paid"}
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                          r.isPaid ? "bg-brand-50 text-brand-700 hover:bg-brand-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                        }`}
                      >
                        {r.isPaid ? "Paid" : "Unpaid"}
                      </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {rentHistory.length === 0 && <p className="text-sm text-gray-500 mt-2">No rent history yet.</p>}
          </div>
        </div>
      </div>

      {/* Bills History */}
      <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-brand-700 flex items-center gap-2">
            <MdReceiptLong /> Bills History
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
                    {b.billPeriodStart && b.billPeriodEnd
                      ? `${fmtDate(b.billPeriodStart)} - ${fmtDate(b.billPeriodEnd)}`
                      : fmtDate(b.billDate)}
                    {b.tenants.length > 1 && ` · split among ${b.tenants.length}`}
                    {share?.isPaid && share?.paidDate && ` · Paid on ${fmtDate(share.paidDate)}`}
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
                      share?.isPaid ? "bg-brand-50 text-brand-700 hover:bg-brand-100" : "bg-red-50 text-red-600 hover:bg-red-100"
                    }`}
                  >
                    {share?.isPaid && <MdCheckCircle size={12} />} {share?.isPaid ? "Paid" : "Mark as Paid"}
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
              <DateInput required value={noticeForm.noticeGivenDate}
                onChange={(iso) => setNoticeForm({ ...noticeForm, noticeGivenDate: iso })} />
            </div>
            <div>
              <label className="text-sm text-gray-600">Planned Move-Out Date</label>
              <DateInput required value={noticeForm.plannedMoveOutDate}
                onChange={(iso) => setNoticeForm({ ...noticeForm, plannedMoveOutDate: iso })} />
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
            {depositSummary && (
              <div className="bg-sand-50 rounded-lg p-3 text-sm mb-1">
                <p className="flex justify-between"><span>Deposit Paid</span><span>€{depositSummary.depositAmount}</span></p>
                <p className="flex justify-between text-red-500"><span>Notice Shortfall Penalty</span><span>-€{depositSummary.shortfallPenalty}</span></p>
                <p className="flex justify-between text-red-500"><span>Unpaid Rent</span><span>-€{depositSummary.unpaidRentTotal}</span></p>
                <p className="flex justify-between text-red-500"><span>Unpaid Bills</span><span>-€{depositSummary.unpaidBillsTotal}</span></p>
                <p className="flex justify-between font-semibold border-t border-sand-200 mt-1 pt-1">
                  <span>Remaining Deposit to Refund</span><span>€{depositSummary.remainingDeposit}</span>
                </p>
              </div>
            )}
            <div>
              <label className="text-sm text-gray-600">Move-Out Date</label>
              <DateInput required value={moveOutForm.moveOutDate}
                onChange={(iso) => setMoveOutForm({ ...moveOutForm, moveOutDate: iso })} />
            </div>
            {tenant.deductionApplicable && (
              <>
                <div>
                  <label className="text-sm text-gray-600">Shortfall Deduction Amount (€)</label>
                  <input type="number" step="0.01" min="0" value={moveOutForm.deductionAmount}
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
          propertyId={tenant.property?._id || tenant.property}
          defaultTenantId={tenant._id}
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