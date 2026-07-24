import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  MdApartment,
  MdMeetingRoom,
  MdPeopleAlt,
  MdReceiptLong,
  MdEuro,
  MdNotificationImportant,
  MdWarningAmber,
} from "react-icons/md";
import API from "../api/axios.js";
import StatCard from "../components/StatCard.jsx";
import Modal from "../components/Modal.jsx";

const fmtDate = (d) => (d ? new Date(d).toLocaleDateString("en-GB") : "-");

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [showOverdue, setShowOverdue] = useState(false);
  const [overdueList, setOverdueList] = useState([]);

  useEffect(() => {
    API.get("/dashboard/stats").then((res) => setStats(res.data));
  }, []);

  const openOverdue = async () => {
    const { data } = await API.get("/rent-payments/overdue");
    setOverdueList(data);
    setShowOverdue(true);
  };

  if (!stats) return <p className="text-gray-500">Loading dashboard...</p>;

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={<MdApartment size={24} />} label="Total Properties" value={stats.totalProperties} />
        <StatCard icon={<MdMeetingRoom size={24} />} label="Occupied Rooms" value={`${stats.occupiedRooms} / ${stats.totalRooms}`} />
        <StatCard icon={<MdPeopleAlt size={24} />} label="Active Tenants" value={stats.activeTenants} />
        <StatCard icon={<MdEuro size={24} />} label="Monthly Rent Total" value={`€${stats.totalMonthlyRent}`} />
        <StatCard icon={<MdNotificationImportant size={24} />} label="On Notice" value={stats.noticeTenants} accent="amber" />
        <StatCard icon={<MdReceiptLong size={24} />} label="Unpaid Bills" value={stats.unpaidBills} accent="red" />
        <StatCard icon={<MdMeetingRoom size={24} />} label="Vacant Rooms" value={stats.vacantRooms} accent="amber" />

        <button onClick={openOverdue} className="text-left">
          <div className="bg-white rounded-xl shadow-sm border border-red-200 p-5 flex items-center gap-4 hover:bg-red-50 transition">
            <div className="p-3 rounded-lg bg-red-50 text-red-600">
              <MdWarningAmber size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Rent Due Members</p>
              <p className="text-2xl font-bold text-gray-800">{stats.rentDueMembersCount}</p>
            </div>
          </div>
        </button>
      </div>

      {showOverdue && (
        <Modal title="Rent Due Members" onClose={() => setShowOverdue(false)} wide>
          <div className="flex flex-col gap-2">
            {overdueList.map((r) => (
              <Link
                key={r._id}
                to={`/tenants/${r.tenant._id}`}
                className="flex items-center justify-between border border-sand-200 rounded-lg p-3 text-sm hover:bg-sand-50"
              >
                <div>
                  <p className="font-medium text-gray-800">{r.tenant.fullName}</p>
                  <p className="text-xs text-gray-500">{r.property?.name} · Due {fmtDate(r.dueDate)}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-600">€{r.amount}</span>
              </Link>
            ))}
            {overdueList.length === 0 && <p className="text-sm text-gray-500">No overdue rent right now.</p>}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Dashboard;
