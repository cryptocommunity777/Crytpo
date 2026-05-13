import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import { useAuth } from '../../context/AuthContext';

const LevelIncome = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  // Fetch level income transactions
  useEffect(() => {
    if (!user?.userId) return;

    api.get(`/transaction/transactions/${user.userId}?type=level_income`)
      .then((res) => {
        const sorted = (res.data || []).sort((a, b) => new Date(b.date) - new Date(a.date));
        setTransactions(sorted);
        setFiltered(sorted);
      })
      .catch((err) => {
        console.error("Failed to fetch level income", err);
        setTransactions([]);
        setFiltered([]);
      });
  }, [user?.userId]);

  const handleSearch = (e) => {
    const value = e.target.value.toLowerCase();
    setSearch(value);
    setCurrentPage(1);
    if (!value) return setFiltered(transactions);

    const result = transactions.filter(
      (txn) =>
        txn.description?.toLowerCase().includes(value) ||
        String(txn.fromUserId).includes(value)
    );
    setFiltered(result);
  };

  const totalIncome = filtered.reduce((sum, t) => sum + (t.amount || 0), 0);
  const pageCount = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div style={{ padding: 12, fontFamily: "Segoe UI, sans-serif", fontSize: 13 }}>
      <h2 className="text-slate-900" style={{ marginBottom: 12, fontSize: 16 }}>📈 Level Income</h2>

      {/* Stats + Search */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 12 }}>
        <div><b className="text-slate-900">Total Records:</b> {filtered.length}</div>
        <div className="text-yellow-400"><b className="text-slate-900">Total Income:</b> ${totalIncome.toFixed(2)}</div>
        <input
          type="text"
          placeholder="Search by user or description..."
          value={search}
          onChange={handleSearch}
          style={{ padding: 6, borderRadius: 4, border: "1px solid #ccc", maxWidth: 200, fontSize: 12 }}
        />
      </div>

      {/* Table */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: 500, fontSize: 12 }}>
          <thead>
            <tr style={{ background: "#2a9d8f", color: "#fff", fontSize: 12 }}>
              <th style={thStyle}>Sr. No</th>
              <th style={thStyle}>Date</th>
              <th style={thStyle}>Time</th>
              <th style={thStyle}>From User</th>
              <th style={thStyle}>Level</th>
              <th style={thStyle}>Amount</th>
              <th style={thStyle}>Package</th>
              <th style={thStyle}>Description</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length > 0 ? paginated.map((txn, idx) => {
              const levelMatch = txn.description?.match(/Level (\d+)/);
              const level = levelMatch ? levelMatch[1] : "-";
              const fromUser = txn.fromUserId || txn.description?.match(/user (\d{5,})/)?.[1] || "N/A";
              const isSelfTopup = fromUser === String(user.userId);

              return (
                <tr key={idx} style={{ background: idx % 2 ? "#f9f9f9" : "#fff", fontWeight: isSelfTopup ? "bold" : "normal" }}>
                  <td style={tdStyle}>{(currentPage-1)*ITEMS_PER_PAGE+idx+1}</td>
                  <td style={tdStyle}>{new Date(txn.date).toLocaleDateString()}</td>
                  <td style={tdStyle}>{new Date(txn.date).toLocaleTimeString()}</td>
                  <td style={tdStyle}>{fromUser}</td>
                  <td style={tdStyle}>{level}</td>
                  <td style={tdStyle}>${txn.amount?.toFixed(2) || "0.00"}</td>
                  <td style={tdStyle}>{txn.package ? `$${txn.package}` : "-"}</td>
                  <td style={tdStyle}>{txn.description || "Level income"}</td>
                </tr>
              );
            }) : (
              <tr className="text-slate-900">
                <td colSpan="8" style={emptyCellStyle}>No level income records found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pageCount > 1 && (
        <div style={{ marginTop: 12, textAlign: "center" }}>
          <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => p - 1)} style={pageBtnStyle(currentPage === 1)}>⏮ Prev</button>
          <span style={{ margin: "0 6px", fontSize: 12 }}>Page {currentPage} of {pageCount}</span>
          <button disabled={currentPage === pageCount} onClick={() => setCurrentPage(p => p + 1)} style={pageBtnStyle(currentPage === pageCount)}>Next ⏭</button>
        </div>
      )}
    </div>
  );
};

const thStyle = { textAlign: "left", padding: "6px 8px", fontWeight: "bold", borderBottom: "1px solid #ddd" };
const tdStyle = { padding: "4px 6px", borderBottom: "1px solid #eee", fontSize: 12 };
const emptyCellStyle = { textAlign: "center", padding: 12, color: "#777", fontSize: 12 };
const pageBtnStyle = (disabled) => ({
  padding: "4px 10px",
  margin: "0 2px",
  borderRadius: 4,
  backgroundColor: disabled ? "#ccc" : "#2a9d8f",
  color: "white",
  border: "none",
  cursor: disabled ? "not-allowed" : "pointer",
  fontSize: 12,
});

export default LevelIncome;
