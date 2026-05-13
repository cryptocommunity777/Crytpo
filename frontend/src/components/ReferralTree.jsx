import React, { useState } from "react";
import api from "../api/axios";

function ReferralTree() {
  const [userId, setUserId] = useState("");
  const [treeData, setTreeData] = useState(null);
  const [directCount, setDirectCount] = useState(0);
  const [totalTeamCount, setTotalTeamCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResult, setSearchResult] = useState(null);

  // 🔹 Load root user tree with children counts
  const handleLoadTree = async () => {
    if (!userId) return;
    setLoading(true);
    setError("");

    try {
      const [treeRes, allTeamRes] = await Promise.all([
        api.get(`/user/tree/${userId}`),
        api.get(`/user/all-team/${userId}`),
      ]);

      const childrenWithCounts = await Promise.all(
        (treeRes.data.children || []).map(async (child) => {
          try {
            const teamRes = await api.get(`/user/all-team/${child.userId}`);
            return {
              ...child,
              expanded: false,
              childrenLoaded: false,
              directCount: child.children?.length || 0,
              totalCount: teamRes.data.totalTeamCount || 0,
              isExactMatch: false,
              isPathMatch: false,
            };
          } catch {
            return {
              ...child,
              expanded: false,
              childrenLoaded: false,
              directCount: child.children?.length || 0,
              totalCount: 0,
              isExactMatch: false,
              isPathMatch: false,
            };
          }
        })
      );

      const rootNode = {
        ...treeRes.data,
        expanded: true,
        childrenLoaded: true,
        children: childrenWithCounts,
        directCount: treeRes.data.children?.length || 0,
        totalCount: allTeamRes.data.totalTeamCount,
        isExactMatch: false,
        isPathMatch: false,
      };

      setTreeData(rootNode);
      setDirectCount(rootNode.directCount);
      setTotalTeamCount(rootNode.totalCount);
      setSearchResult(null);
      setSearchQuery(""); // Clear search on new load
    } catch (err) {
      console.error(err);
      setError("❌ Referral tree not found or error fetching data");
      setTreeData(null);
      setDirectCount(0);
      setTotalTeamCount(0);
    } finally {
      setLoading(false);
    }
  };

  // 🔹 Expand/collapse a node and lazy load children
  const handleExpandNode = async (node) => {
    if (node.childrenLoaded) {
      node.expanded = !node.expanded;
      setTreeData({ ...treeData });
      return;
    }

    try {
      const [treeRes, allTeamRes] = await Promise.all([
        api.get(`/user/tree/${node.userId}`),
        api.get(`/user/all-team/${node.userId}`),
      ]);

      const childrenWithCounts = await Promise.all(
        (treeRes.data.children || []).map(async (child) => {
          try {
            const teamRes = await api.get(`/user/all-team/${child.userId}`);
            return {
              ...child,
              expanded: false,
              childrenLoaded: false,
              directCount: child.children?.length || 0,
              totalCount: teamRes.data.totalTeamCount || 0,
              isExactMatch: false,
              isPathMatch: false,
            };
          } catch {
            return {
              ...child,
              expanded: false,
              childrenLoaded: false,
              directCount: child.children?.length || 0,
              totalCount: 0,
              isExactMatch: false,
              isPathMatch: false,
            };
          }
        })
      );

      node.children = childrenWithCounts;
      node.directCount = treeRes.data.children?.length || 0;
      node.totalCount = allTeamRes.data.totalTeamCount;
      node.childrenLoaded = true;
      node.expanded = true;

      setTreeData({ ...treeData });
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Recursive tree renderer (🎨 Design with Yellow Brick Road Logic)
  const renderTree = (node) => {
    
    // Dynamic CSS Classes: Path dikhane ke liye Light Yellow aur Target ke liye Bright Yellow
    let bgClass = "bg-blue-100 text-blue-900"; // Normal Node
    
    if (node.isExactMatch) {
      bgClass = "bg-yellow-300 text-yellow-900 border border-yellow-500 font-bold shadow-md"; // Final Target
    } else if (node.isPathMatch) {
      bgClass = "bg-yellow-100 text-yellow-800 border border-yellow-300 border-dashed"; // Raasta (Path to target)
    }

    return (
      <li key={node.userId} className="list-none">
        <div
          onClick={() => handleExpandNode(node)}
          className={`cursor-pointer p-2 rounded-lg text-sm font-medium shadow-sm flex flex-col gap-1 transition-all ${bgClass}`}
        >
          <div className="flex justify-between items-center">
            <span>
              {node.name || "Unnamed User"}{" "}
              <span className="text-gray-700">(ID: {node.userId})</span>
            </span>
            <span className="text-xs text-gray-600">
              {node.expanded ? "▼" : "▶"}
            </span>
          </div>
          <div className="text-xs text-gray-700 flex gap-4">
            <span>👥 Direct: {node.directCount || 0}</span>
            <span>🌐 Total: {node.totalCount || 0}</span>
          </div>
        </div>

        {node.expanded && node.children && node.children.length > 0 && (
          <ul className="ml-6 mt-2 space-y-2 border-l pl-3 border-blue-200">
            {node.children.map((child) => renderTree(child))}
          </ul>
        )}
      </li>
    );
  };

  // 🚀 NAYA SMART SEARCH LOGIC (Bina Auto-Open kiye)
  const handleSearchInTree = () => {
    if (!searchQuery || !treeData) return;

    const query = searchQuery.toLowerCase().trim();
    let foundNode = null;

    // Deep traverse aur marking function
    const traverseAndMark = (node) => {
      if (!node) return false;

      // Purane marks hata do
      node.isExactMatch = false;
      node.isPathMatch = false;

      // Check karo kya yehi banda hai
      const isMatch = String(node.userId).includes(query) ||
                      (node.name && node.name.toLowerCase().includes(query));

      if (isMatch) {
        node.isExactMatch = true;
        if (!foundNode) foundNode = node; // Pinned result ke liye
      }

      // Check karo kya iske bacchon mein koi match hai
      let childHasMatch = false;
      if (node.children) {
        for (let child of node.children) {
          if (traverseAndMark(child)) {
            childHasMatch = true;
          }
        }
      }

      // Agar andar baccha match hua (par ye khud match nahi hai), toh ise Light Yellow Path bana do
      if (childHasMatch && !isMatch) {
        node.isPathMatch = true; 
      }

      // 🛑 YAHAN SE NODE.EXPANDED = TRUE HATA DIYA HAI 🛑
      // Tree bilkul open nahi hoga, admin khud click karke andar jayega

      return isMatch || childHasMatch;
    };

    traverseAndMark(treeData);

    setSearchResult(foundNode);
    setTreeData({ ...treeData });
  };

  return (
    <div className="bg-white rounded-2xl p-5 shadow-md">
      <h2 className="text-xl font-semibold text-indigo-600 mb-4">
        🌳 Referral Tree
      </h2>

      {/* Load Tree */}
      <div className="flex gap-3 mb-4">
        <input
          type="number"
          placeholder="Enter User ID"
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          className="border rounded px-4 py-2 w-full"
        />
        <button
          onClick={handleLoadTree}
          disabled={loading}
          className={`px-4 py-2 rounded text-slate-900 ${
            loading
              ? "bg-indigo-400 cursor-not-allowed"
              : "bg-indigo-600 hover:bg-indigo-700"
          }`}
        >
          {loading ? "Loading..." : "Load Tree"}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm italic mb-3">{error}</p>}

      {/* Tree Stats */}
      {treeData && (
        <div className="mb-4 text-sm text-gray-700 space-y-1">
          <p>
            <strong>👥 Direct Team:</strong> {directCount}
          </p>
          <p>
            <strong>🌐 Total Team (All Levels):</strong> {totalTeamCount}
          </p>
        </div>
      )}

      {/* Search */}
      {treeData && (
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            placeholder="Search by ID or Name in tree"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded px-4 py-2 w-full"
            onKeyDown={(e) => e.key === 'Enter' && handleSearchInTree()}
          />
          <button
            onClick={handleSearchInTree}
            className="px-4 py-2 rounded bg-green-600 text-slate-900 hover:bg-green-700"
          >
            Search
          </button>
        </div>
      )}

      {/* Search Result Pinned */}
      {searchResult && (
        <div className="mb-4">
          <h3 className="font-semibold text-gray-700 mb-2">
            🔎 Search Result (Pinned on Top)
          </h3>
          <ul className="ml-2">{renderTree(searchResult)}</ul>
        </div>
      )}

      {/* Full Tree */}
      {treeData && (
        <>
          <h3 className="font-semibold text-gray-700 mt-4">🌐 Full Tree</h3>
          <ul className="mt-2 ml-2">{renderTree(treeData)}</ul>
        </>
      )}
    </div>
  );
}

export default ReferralTree;