import { useEffect, useState } from "react";
import {
  MdApartment,
  MdMeetingRoom,
  MdPeopleAlt,
  MdReceiptLong,
  MdEuro,
  MdNotificationImportant,
} from "react-icons/md";
import API from "../api/axios.js";
import StatCard from "../components/StatCard.jsx";

const Dashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    API.get("/dashboard/stats").then((res) => setStats(res.data));
  }, []);

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
      </div>
    </div>
  );
};

export default Dashboard;
