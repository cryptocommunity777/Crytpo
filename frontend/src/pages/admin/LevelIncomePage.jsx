import React, { useEffect, useState } from "react";
import api from "../../api/axios";

// 🔹 Helpers: Decimal128 / string / number -> safe number + formatted string
const normalizeAmount = (value) => {
  if (value == null) return 0;

  // Already number
  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : value;
  }

  // String like "$10", "10 USDT"
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }

  // Mongo Decimal128 JSON: { $numberDecimal: "123.45" }
  if (typeof value === "object") {
    if (value.$numberDecimal) {
      const n = Number(value.$numberDecimal);
      return Number.isNaN(n) ? 0 : n;
    }

    // Direct Decimal128 instance
    if (value._bsontype === "Decimal128" && typeof value.toString === "function") {
      const n = Number(value.toString());
      return Number.isNaN(n) ? 0 : n;
    }
  }

  return 0;
};

const formatAmount = (value, digits = 2) => {
  const n = normalizeAmount(value);
  return n.toFixed(digits);
};

const LevelIncomePage = () => {
  const [incomes, setIncomes] = useState([]);
  const [filteredIncomes, setFilteredIncomes] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [incomesPerPage, setIncomesPerPage] = useState(10);

  const [searchUser, setSearchUser] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [level, setLevel] = useState("");

  // Fetch Level Income from backend
  const fetchLevelIncomes = async () => {
    try {
      const token = localStorage.getItem("adminToken");
      if (!token) return console.error("No admin token found.");

      const params = {};
      if (searchUser) params.userId = searchUser;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;
      if (level) params.level = level;

      const res = await api.get("/admin/level-income", {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const data = res.data || [];
      setIncomes(data);
      setFilteredIncomes(data);
      setCurrentPage(1);
    } catch (err) {
      console.error("Failed to fetch level income:", err.response?.data || err);
    }
  };

  useEffect(() => {
    fetchLevelIncomes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Local filtering
  useEffect(() => {
    const filtered = incomes.filter((inc) => {
      const matchUser = searchUser
        ? inc.userId?.toString().includes(searchUser) ||
          (inc.fromUserId && inc.fromUserId.toString().includes(searchUser))
        : true;

      const matchLevel = level ? inc.level?.toString() === level : true;

      const created = new Date(inc.createdAt);
      const matchFrom = fromDate ? created >= new Date(fromDate) : true;
      const matchTo = toDate ? created <= new Date(toDate) : true;

      return matchUser && matchLevel && matchFrom && matchTo;
    });

    setFilteredIncomes(filtered);
    setCurrentPage(1);
  }, [searchUser, fromDate, toDate, level, incomes]);

  // Pagination
  const indexOfLast = currentPage * incomesPerPage;
  const indexOfFirst = indexOfLast - incomesPerPage;
  const currentIncomes = filteredIncomes.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredIncomes.length / incomesPerPage);

  const handleNext = () =>
    currentPage < totalPages && setCurrentPage((prev) => prev + 1);
  const handlePrev = () =>
    currentPage > 1 && setCurrentPage((prev) => prev - 1);

  // Totals (Decimal-safe)
  const totalIncome = incomes.reduce(
    (sum, inc) => sum + normalizeAmount(inc.amount),
    0
  );
  const filteredTotal = filteredIncomes.reduce(
    (sum, inc) => sum + normalizeAmount(inc.amount),
    0
  );
  const today = new Date();
  const todayIncome = incomes
    .filter(
      (inc) =>
        new Date(inc.createdAt).toDateString() === today.toDateString()
    )
    .reduce((sum, inc) => sum + normalizeAmount(inc.amount), 0);

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-indigo-600 flex items-center gap-2">
        📊 Level Income
      </h2>

      {/* Summary Cards */}
      <div className="flex flex-wrap gap-4 mb-6 text-sm font-medium">
        <div className="bg-green-50 border border-green-200 p-3 rounded w-full md:w-1/4">
          Total Income:{" "}
          <span className="text-green-700 font-semibold">
            ${totalIncome.toFixed(2)}
          </span>
        </div>
        <div className="bg-blue-50 border border-blue-200 p-3 rounded w-full md:w-1/4">
          Today&apos;s Income:{" "}
          <span className="text-blue-700 font-semibold">
            ${todayIncome.toFixed(2)}
          </span>
        </div>
        <div className="bg-purple-50 border border-purple-200 p-3 rounded w-full md:w-1/4">
          Filtered Total:{" "}
          <span className="text-purple-700 font-semibold">
            ${filteredTotal.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-indigo-50 p-5 rounded-xl mb-6 shadow-inner flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search by User ID or From User ID"
          value={searchUser}
          onChange={(e) => setSearchUser(e.target.value)}
          className="px-4 py-2 border border-indigo-300 rounded w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="px-4 py-2 border border-indigo-300 rounded w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="px-4 py-2 border border-indigo-300 rounded w-full md:w-1/4 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        />
        <select
          value={level}
          onChange={(e) => setLevel(e.target.value)}
          className="px-4 py-2 border border-indigo-300 rounded w-full md:w-1/6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          <option value="">All Levels</option>
          {[1, 2, 3, 4, 5].map((lv) => (
            <option key={lv} value={lv}>
              Level {lv}
            </option>
          ))}
        </select>
        <select
          value={incomesPerPage}
          onChange={(e) => setIncomesPerPage(Number(e.target.value))}
          className="px-4 py-2 border border-indigo-300 rounded w-full md:w-1/6 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        >
          {[10, 20, 50, 100].map((num) => (
            <option key={num} value={num}>
              {num} per page
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full table-auto text-left border-collapse">
          <thead>
            <tr className="bg-indigo-100 text-sm font-semibold">
              <th className="p-2 border">User ID</th>
              <th className="p-2 border">From User ID</th>
              <th className="p-2 border">Package</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">Level</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Time</th>
            </tr>
          </thead>
          <tbody>
            {currentIncomes.length > 0 ? (
              currentIncomes.map((inc, idx) => {
                const createdAt = new Date(inc.createdAt);
                return (
                  <tr
                    key={idx}
                    className="border-t hover:bg-indigo-50 text-sm"
                  >
                    <td className="p-2 border">{inc.userId}</td>
                    <td className="p-2 border">
                      {inc.fromUserId || "-"}
                    </td>
                    <td className="p-2 border">
                      {inc.packageName || "-"}
                    </td>
                    <td className="p-2 border">
                      ${formatAmount(inc.amount)}
                    </td>
                    <td className="p-2 border">
                      {inc.level || "-"}
                    </td>
                    <td className="p-2 border">
                      {createdAt.toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-2 border">
                      {createdAt.toLocaleTimeString("en-US")}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td
                  colSpan="7"
                  className="text-center py-4 text-gray-500"
                >
                  No level income found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-4 text-sm">
          <button
            onClick={handlePrev}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded ${
              currentPage === 1
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-500 text-slate-900 hover:bg-indigo-600"
            }`}
          >
            Previous
          </button>
          <span className="text-gray-700">
            Page {currentPage} of {totalPages}
          </span>
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded ${
              currentPage === totalPages
                ? "bg-gray-300 cursor-not-allowed"
                : "bg-indigo-500 text-slate-900 hover:bg-indigo-600"
            }`}
          >
            Next
          </button>
        </div>
      )}

      {/* Bottom Total */}
      <div className="mt-6 text-right text-sm font-medium text-gray-700">
        Filtered Total Income:{" "}
        <span className="text-purple-600 font-semibold">
          ${filteredTotal.toFixed(2)}
        </span>
      </div>
    </div>
  );
};

export default LevelIncomePage;
