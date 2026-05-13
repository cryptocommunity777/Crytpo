import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { FaUndo } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const allowedTypes = ["topup", "transfer", "direct_income", "level_income", "spin_income"];

// 🔹 Helpers: Decimal128 / string / number -> safe number/string
const normalizeAmount = (value) => {
  if (value == null) return 0;

  if (typeof value === "number") {
    return Number.isNaN(value) ? 0 : value;
  }

  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.-]/g, "");
    const n = Number(cleaned);
    return Number.isNaN(n) ? 0 : n;
  }

  if (typeof value === "object") {
    if (value.$numberDecimal) {
      const n = Number(value.$numberDecimal);
      return Number.isNaN(n) ? 0 : n;
    }

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

const ReverseTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTxs, setSelectedTxs] = useState([]);
  const [selectedTxForSingle, setSelectedTxForSingle] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [reversing, setReversing] = useState(false);

  // 🔹 Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [filters, setFilters] = useState({
    userId: "",
    type: "",
    fromDate: "",
    toDate: "",
  });

  const navigate = useNavigate();

  // ------------------ Fetch Transactions ------------------
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Admin not logged in. Please login.");

      const res = await api.get("/admin/transactions", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const allowedTxs = (res.data || []).filter(tx => allowedTypes.includes(tx.type));

      setTransactions(allowedTxs);
      setFiltered(allowedTxs);
    } catch (err) {
      console.error("Fetch transactions error:", err);
      setError(err.message || "Failed to fetch transactions");
      if (err.message.includes("Admin not logged in")) navigate("/admin-login");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ------------------ Apply Filters ------------------
  useEffect(() => {
    let result = [...transactions];

    if (filters.userId)
      result = result.filter(tx => String(tx.userId).includes(filters.userId.trim()));
    if (filters.type && allowedTypes.includes(filters.type))
      result = result.filter(tx => tx.type === filters.type);
    if (filters.fromDate) {
      const from = new Date(filters.fromDate);
      result = result.filter(tx => new Date(tx.date || tx.createdAt) >= from);
    }
    if (filters.toDate) {
      const to = new Date(filters.toDate);
      result = result.filter(tx => new Date(tx.date || tx.createdAt) <= to);
    }

    setFiltered(result);
    setCurrentPage(1); // Reset to page 1 whenever filters change
  }, [filters, transactions]);

  // ------------------ Multi/Single Select ------------------
  const toggleSelect = (tx) => {
    if (!tx._id) return;
    if (tx.type === "topup") {
      const relatedTxIds = transactions
        .filter(
          t => t.relatedTo === tx._id && !selectedTxs.includes(t._id) && !t.reversed
        )
        .map(t => t._id);

      setSelectedTxs(prev =>
        prev.includes(tx._id)
          ? prev.filter(id => id !== tx._id && !relatedTxIds.includes(id))
          : [...prev, tx._id, ...relatedTxIds]
      );
    } else {
      setSelectedTxs(prev =>
        prev.includes(tx._id) ? prev.filter(id => id !== tx._id) : [...prev, tx._id]
      );
    }
  };

  // ------------------ Reverse API Call ------------------
  const handleReverse = async () => {
    if (!reason.trim()) return alert("Reason is required!");

    const txIds = selectedTxForSingle
      ? [selectedTxForSingle._id]
      : selectedTxs.filter(id => !!id);

    if (txIds.length === 0) return alert("Select at least one transaction");

    try {
      setReversing(true);
      const token = localStorage.getItem("adminToken");
      if (!token) throw new Error("Admin token missing. Please login.");

      const res = await api.put(
        "/admin/transactions/reverse",
        { txIds, reason: reason.trim() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      const reversedTxIds = res.data?.reversedTxs || [];

      setTransactions(prev =>
        prev.map(tx => reversedTxIds.includes(tx._id) ? { ...tx, reversed: true } : tx)
      );
      setFiltered(prev =>
        prev.map(tx => reversedTxIds.includes(tx._id) ? { ...tx, reversed: true } : tx)
      );

      alert(`✅ ${reversedTxIds.length} Transaction(s) Reversed Successfully`);
    } catch (err) {
      console.error("Reverse error:", err);
      alert(err.response?.data?.message || err.message || "Failed to reverse transactions");
    } finally {
      setReason("");
      setSelectedTxs([]);
      setSelectedTxForSingle(null);
      setModalOpen(false);
      setReversing(false);
    }
  };

  const isRelatedTransaction = (tx) => !!tx.relatedTo;

  // ------------------ Pagination Logic ------------------
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filtered.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filtered.length / itemsPerPage);

  if (loading) return <p className="p-4">Loading transactions...</p>;
  if (error) return <p className="p-4 text-red-600">{error}</p>;

  return (
    <div className="p-4 text-black">
      <h2 className="text-xl font-semibold mb-4 text-indigo-600 text-center">
        Reverse Transactions
      </h2>

      {/* Filters */}
      <div className="grid md:grid-cols-4 gap-4 mb-4">
        <input
          type="text"
          placeholder="User ID"
          value={filters.userId}
          onChange={e => setFilters({ ...filters, userId: e.target.value })}
          className="border p-2 rounded"
        />
        <select
          value={filters.type}
          onChange={e => setFilters({ ...filters, type: e.target.value })}
          className="border p-2 rounded"
        >
          <option value="">All Types</option>
          {allowedTypes.map(t => (
            <option key={t} value={t}>{t.replace("_", " ")}</option>
          ))}
        </select>
        <input
          type="date"
          value={filters.fromDate}
          onChange={e => setFilters({ ...filters, fromDate: e.target.value })}
          className="border p-2 rounded"
        />
        <input
          type="date"
          value={filters.toDate}
          onChange={e => setFilters({ ...filters, toDate: e.target.value })}
          className="border p-2 rounded"
        />
      </div>

      {/* Bulk Reverse Button */}
      <div className="mb-4">
        <button
          disabled={selectedTxs.length === 0}
          onClick={() => setModalOpen(true)}
          className="px-4 py-2 bg-red-500 text-slate-900 rounded hover:bg-red-600 disabled:opacity-50"
        >
          Reverse Selected ({selectedTxs.length})
        </button>
      </div>

      {/* Transactions Table */}
      <div className="overflow-x-auto">
        <table className="w-full border rounded shadow text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 border">Select</th>
              <th className="p-2 border">#</th>
              <th className="p-2 border">User ID</th>
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Type</th>
              <th className="p-2 border">Amount</th>
              <th className="p-2 border">From</th>
              <th className="p-2 border">To</th>
              <th className="p-2 border">Date</th>
              <th className="p-2 border">Source</th>
              <th className="p-2 border">Description</th>
              <th className="p-2 border">Reversed</th>
              <th className="p-2 border">Action</th>
            </tr>
          </thead>
          <tbody>
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan="13" className="text-center p-4">
                  No transactions found.
                </td>
              </tr>
            ) : (
              currentItems.map((tx, index) => {
                const isSelected =
                  selectedTxs.includes(tx._id) || selectedTxForSingle?._id === tx._id;
                
                // Real Index Numbering
                const actualIndex = indexOfFirstItem + index + 1;

                return (
                  <tr
                    key={tx._id}
                    className={`text-center transition-all duration-200 ${
                      tx.reversed
                        ? "bg-green-100 text-green-800 font-semibold"
                        : isRelatedTransaction(tx)
                        ? "bg-yellow-50 text-yellow-800"
                        : isSelected
                        ? "bg-red-50 text-red-800"
                        : ""
                    }`}
                  >
                    <td className="border p-2">
                      {!tx.reversed && (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(tx)}
                        />
                      )}
                    </td>

                    <td className="border p-2">{actualIndex}</td>
                    <td className="border p-2">{tx.userId}</td>
                    <td className="border p-2">{tx.name || "-"}</td>

                    <td className="border p-2 capitalize">
                      {tx.type.replace("_", " ")}
                    </td>

                    <td className="border p-2 font-bold">
                      ₹ {formatAmount(tx.amount)}
                    </td>

                    <td className="border p-2">{tx.fromUserId || "-"}</td>
                    <td className="border p-2">{tx.toUserId || "-"}</td>

                    <td className="border p-2">
                      {tx.date
                        ? new Date(tx.date).toLocaleString("en-IN")
                        : tx.createdAt
                        ? new Date(tx.createdAt).toLocaleString("en-IN")
                        : "N/A"}
                    </td>

                    <td className="border p-2">{tx.source || "-"}</td>
                    <td className="border p-2">{tx.description || "-"}</td>

                    {/* ✅ STATUS COLUMN */}
                    <td className="border p-2">
                      {tx.reversed ? (
                        <span className="px-2 py-1 bg-green-500 text-slate-900 rounded text-xs">
                          ✔ Reversed
                        </span>
                      ) : (
                        <span className="px-2 py-1 bg-gray-300 rounded text-xs">
                          Active
                        </span>
                      )}
                    </td>

                    {/* ✅ ACTION */}
                    <td className="border p-2">
                      {tx.reversed ? (
                        <span className="text-green-600 font-semibold">
                          Done
                        </span>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedTxForSingle(tx);
                            setModalOpen(true);
                          }}
                          className="flex items-center px-2 py-1 bg-red-500 text-slate-900 rounded hover:bg-red-600 transition"
                        >
                          <FaUndo className="mr-1" /> Reverse
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* ✅ Pagination Controls */}
      {filtered.length > 0 && (
        <div className="flex flex-col md:flex-row justify-between items-center mt-4 p-3 bg-gray-50 border rounded shadow-sm">
          <div className="mb-2 md:mb-0">
            <span className="mr-2 text-sm text-gray-700">Rows per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1); // Reset to page 1 on limit change
              }}
              className="border p-1 rounded text-sm bg-white"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
              <option value={200}>200</option>
            </select>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((prev) => prev - 1)}
              className="px-3 py-1 bg-indigo-500 text-slate-900 rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="font-semibold text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((prev) => prev + 1)}
              className="px-3 py-1 bg-indigo-500 text-slate-900 rounded hover:bg-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-slate-50 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Confirm Reverse</h3>
            <input
              type="text"
              placeholder="Reason for reversal"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="border p-2 rounded w-full mb-3"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setModalOpen(false);
                  setSelectedTxForSingle(null);
                  setReason("");
                }}
                className="px-3 py-1 rounded bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleReverse}
                disabled={reversing}
                className="px-3 py-1 rounded bg-red-500 text-slate-900 hover:bg-red-600 disabled:opacity-50"
              >
                {reversing ? "Reversing..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReverseTransaction;