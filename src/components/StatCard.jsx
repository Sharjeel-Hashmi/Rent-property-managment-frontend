const StatCard = ({ icon, label, value, accent = "brand" }) => {
  const colorMap = {
    brand: "bg-brand-50 text-brand-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-red-50 text-red-600",
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-sand-200 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-lg ${colorMap[accent]}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  );
};

export default StatCard;
