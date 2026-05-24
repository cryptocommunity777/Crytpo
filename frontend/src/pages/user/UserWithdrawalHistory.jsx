import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import {
  Search,
  Banknote,
  ChevronLeft,
  ChevronRight,
  Wallet,
  Bitcoin,
} from "lucide-react";

function UserWithdrawalHistory() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  const itemsPerPage = 10;

  const user = JSON.parse(localStorage.getItem("user"));
  const userId = Number(user?.userId);

  useEffect(() => {
    const fetchWithdrawals = async () => {
      try {
        setLoading(true);

        const res = await api.get(
          `/wallet/withdrawals/${userId}?t=${new Date().getTime()}`
        );

        setWithdrawals(res.data.withdrawals || []);
      } catch (error) {
        console.error("Error fetching withdrawal history:", error);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchWithdrawals();
    else setLoading(false);
  }, [userId]);

  // GROUP ENTRIES
  const groupWithdrawals = (list) => {
    const sorted = [...list].sort(
      (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
    );

    const groups = [];
    const THRESHOLD_MS = 5000;

    for (const item of sorted) {
      const itemTime = new Date(item.createdAt).getTime();
      const lastGroup = groups[groups.length - 1];

      if (
        lastGroup &&
        itemTime -
          new Date(
            lastGroup.entries[lastGroup.entries.length - 1].createdAt
          ).getTime() <=
          THRESHOLD_MS
      ) {
        lastGroup.entries.push(item);

        lastGroup.totalGross += Number(item.grossAmount || 0) * 2;
        lastGroup.totalFee += Number(item.fee || 0) * 2;
        lastGroup.totalCryptoNet += Number(item.netAmount || 0);
        lastGroup.totalTopupNet += Number(item.netAmount || 0);

        lastGroup.sources.push(item.source || "-");

        if (item.status?.toLowerCase() === "pending")
          lastGroup.status = "pending";
        else if (
          item.status?.toLowerCase() === "rejected" &&
          lastGroup.status !== "pending"
        )
          lastGroup.status = "rejected";
      } else {
        groups.push({
          _id: item._id,
          createdAt: item.createdAt,
          entries: [item],
          totalGross: Number(item.grossAmount || 0) * 2,
          totalFee: Number(item.fee || 0) * 2,
          totalCryptoNet: Number(item.netAmount || 0),
          totalTopupNet: Number(item.netAmount || 0),
          sources: [item.source || "-"],
          walletAddress: item.walletAddress,
          status: item.status || "pending",
        });
      }
    }

    return groups;
  };

  const grouped = groupWithdrawals(withdrawals);

  const totalAmount = withdrawals.reduce(
    (sum, w) => sum + Number(w.grossAmount || 0) * 2,
    0
  );

  const filtered = grouped.filter((g) => {
    const searchLower = search.toLowerCase();

    const matchSearch =
      g.status?.toLowerCase().includes(searchLower) ||
      g.sources.join(",").toLowerCase().includes(searchLower) ||
      g.totalGross.toString().includes(searchLower) ||
      new Date(g.createdAt)
        .toLocaleDateString("en-GB")
        .includes(searchLower) ||
      (g.walletAddress?.toLowerCase() || "").includes(searchLower);

    const matchStatus =
      statusFilter === "all" ||
      g.status?.toLowerCase() === statusFilter.toLowerCase();

    return matchSearch && matchStatus;
  });

  const sortedFiltered = [...filtered].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  const totalPages =
    Math.ceil(sortedFiltered.length / itemsPerPage) || 1;

  const startIdx = (currentPage - 1) * itemsPerPage;

  const paginated = sortedFiltered.slice(
    startIdx,
    startIdx + itemsPerPage
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter]);

  const getStatusDetails = (group) => {
    const s = group.status?.toLowerCase();

    if (s === "approved" || s === "success") {
      return {
        label: group.status,
        color:
          "bg-slate-100 text-slate-700 border border-slate-300",
      };
    }

    if (s === "pending") {
      return {
        label: group.status,
        color:
          "bg-slate-100 text-slate-700 border border-slate-300",
      };
    }

    if (s === "rejected" || s === "failed") {
      return {
        label: group.status,
        color:
          "bg-slate-100 text-slate-700 border border-slate-300",
      };
    }

    return {
      label: group.status || "UNKNOWN",
      color:
        "bg-slate-100 text-slate-700 border border-slate-300",
    };
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-10 relative z-10 animate-in fade-in duration-500">

      <style>{`
        .custom-scroll::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }

        .custom-scroll::-webkit-scrollbar-track {
          background: #f1f5f9;
        }

        .custom-scroll::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-slate-700 to-slate-500 uppercase tracking-wide flex items-center gap-3">
            <Banknote className="text-slate-700" size={28} />
            Withdrawal History
          </h2>

          <p className="text-slate-500 text-xs md:text-sm font-bold tracking-widest uppercase mt-1">
            Track all your fund withdrawals
          </p>
        </div>
      </div>

      {/* STATS */}
      <div className="mb-8">
        <div className="bg-white shadow-sm rounded-2xl border border-slate-200 p-5 md:p-6 relative overflow-hidden flex flex-col justify-center max-w-sm">

          <h3 className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-2">
            <Wallet size={14} className="text-slate-700" />
            Total Withdrawn
          </h3>

          <p className="text-3xl md:text-4xl font-black text-slate-800">
            ${totalAmount.toFixed(2)}
          </p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-between items-center bg-white shadow-sm p-4 rounded-2xl border border-slate-200">

        <div className="relative w-full sm:w-80 group">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search
              size={16}
              className="text-slate-400"
            />
          </div>

          <input
            type="text"
            placeholder="Search amount, wallet, source..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-900 text-sm font-bold tracking-wide rounded-xl px-4 py-3 pl-10 focus:border-slate-400 focus:outline-none transition-all placeholder-slate-400"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest whitespace-nowrap">
            Filter:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-auto bg-white border border-slate-200 text-slate-900 text-sm font-bold rounded-xl px-4 py-3 focus:border-slate-400 focus:outline-none transition-all appearance-none cursor-pointer capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow-sm rounded-2xl border border-slate-200 overflow-hidden relative">

        <div className="overflow-x-auto custom-scroll w-full relative z-10">
          <table className="w-full text-xs sm:text-sm text-left whitespace-nowrap">

            <thead className="bg-slate-50 text-slate-700 text-[10px] md:text-xs uppercase tracking-widest border-b border-slate-200">
              <tr>
                <th className="p-4 font-black text-center">Sr.</th>
                <th className="p-4 font-black">Date</th>
                <th className="p-4 font-black">Total</th>
                <th className="p-4 font-black">Fee</th>
                <th className="p-4 font-black">
                  <div className="flex items-center gap-1">
                     USDT 
                  </div>
                </th>

                <th className="p-4 font-black">
                  <div className="flex items-center gap-1">
                     TopUp Wallet
                  </div>
                </th>

                <th className="p-4 font-black">Source</th>
                <th className="p-4 font-black">Wallet Address</th>
                <th className="p-4 font-black text-center">Status</th>
                <th className="p-4 font-black text-center">Details</th>
              </tr>
            </thead>

            <tbody className="text-slate-700">

              {loading ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                      Loading History...
                    </span>
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan="10" className="text-center py-10">
                    <span className="text-slate-500 font-bold text-sm uppercase tracking-widest">
                      No Withdrawal Records Found
                    </span>
                  </td>
                </tr>
              ) : (
                paginated.map((group, idx) => {
                  const statusInfo = getStatusDetails(group);

                  return (
                    <tr
                      key={group._id}
                      className="border-b border-slate-100 bg-white"
                    >
                      <td className="p-4 font-bold text-slate-500 text-center">
                        {startIdx + idx + 1}
                      </td>

                      <td className="p-4 text-slate-500 font-mono text-xs">
                        {new Date(group.createdAt).toLocaleDateString(
                          "en-GB"
                        )}
                      </td>

                      <td className="p-4 font-bold text-slate-900">
                        ${group.totalGross.toFixed(2)}
                      </td>

                      <td className="p-4 font-bold text-slate-700">
                        -${group.totalFee.toFixed(2)}
                      </td>

                      <td className="p-4 font-black text-slate-700">
                        ${group.totalCryptoNet.toFixed(2)}
                      </td>

                      <td className="p-4 font-black text-slate-700">
                        ${group.totalTopupNet.toFixed(2)}
                      </td>

                     <td className="p-4">
  <div className="flex flex-wrap items-center gap-1">
    {[...new Set(group.sources)].map((s, i) => {
      const source = s?.toLowerCase();

      return (
        <span
          key={i}
          className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest border ${
            source?.includes("pool")
              ? "bg-green-100 text-green-600 border-green-300"
              : source?.includes("direct")
              ? "bg-purple-100 text-purple-600 border-purple-300"
              : source?.includes("level")
              ? "bg-blue-100 text-blue-600 border-blue-300"
              : source?.includes("reward")
              ? "bg-yellow-100 text-yellow-600 border-yellow-300"
              : "bg-slate-100 text-slate-700 border-slate-300"
          }`}
        >
          {source?.includes("pool")
            ? "Community Earning"
            : s}
        </span>
      );
    })}
  </div>
</td>

                      <td className="p-4 text-slate-700 font-mono text-[10px] sm:text-xs">
                        {group.walletAddress ? (
                          <span className="px-2 py-1 rounded border border-slate-200">
                            {group.walletAddress}
                          </span>
                        ) : (
                          "N/A"
                        )}
                      </td>

                      <td className="p-4 text-center">
                        <span
                          className={`px-2.5 py-1 text-[9px] md:text-[10px] font-black tracking-widest rounded-md uppercase ${statusInfo.color}`}
                        >
                          {statusInfo.label}
                        </span>
                      </td>

                      <td className="p-4 text-center text-slate-400 font-bold">
                        -
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION */}
        {!loading && sortedFiltered.length > 0 && (
          <div className="p-4 border-t border-slate-100 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-4 relative z-10">

            <span className="text-slate-500 text-[10px] md:text-xs font-black uppercase tracking-widest">
              Showing {startIdx + 1} to{" "}
              {Math.min(
                startIdx + itemsPerPage,
                sortedFiltered.length
              )}{" "}
              of {sortedFiltered.length} Entries
            </span>

            <div className="flex items-center gap-2">

              <button
                onClick={() =>
                  setCurrentPage((p) => Math.max(p - 1, 1))
                }
                disabled={currentPage === 1}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  currentPage === 1
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ChevronLeft size={18} />
              </button>

              <span className="bg-white border border-slate-200 text-slate-900 text-xs font-bold px-4 py-2 rounded-lg">
                {currentPage} / {totalPages}
              </span>

              <button
                onClick={() =>
                  setCurrentPage((p) =>
                    Math.min(p + 1, totalPages)
                  )
                }
                disabled={currentPage === totalPages}
                className={`p-2 rounded-lg flex items-center justify-center transition-all ${
                  currentPage === totalPages
                    ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                    : "bg-white text-slate-700 border border-slate-200 hover:bg-slate-100"
                }`}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserWithdrawalHistory;