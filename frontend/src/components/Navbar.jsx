// frontend/src/components/Navbar.jsx

import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { branches } from "../data/branches";

export default function Navbar() {
  const [selectedBranch, setSelectedBranch] = useState("");

  // Load saved branch on first load
  useEffect(() => {
    const savedBranch = localStorage.getItem("selectedBranch");

    if (savedBranch) {
      setSelectedBranch(savedBranch);
    }
  }, []);

  // Save to localStorage when changed
  const handleBranchChange = (e) => {
    const branchId = e.target.value;

    const branch = branches.find((b) => b.id.toString() === branchId);

    setSelectedBranch(branchId);

    localStorage.setItem("selectedBranch", branchId);
    localStorage.setItem("selectedBranchData", JSON.stringify(branch));
  };

  return (
    <nav className="w-full bg-sky-300 text-slate-700">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Left side */}
        <Link
          to="/"
          className="text-lg font-semibold tracking-tight hover:text-indigo-600 transition"
        >
          წითელი ნაშთები
        </Link>

        {/* Center branch selector */}
        <select
          value={selectedBranch}
          onChange={handleBranchChange}
          className="px-3 py-2 rounded-md border border-slate-300 bg-white text-sm"
        >
          <option value="">Select Branch</option>

          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name} ({branch.brand})
            </option>
          ))}
        </select>

        {/* Right side */}
        <div className="flex items-center gap-6 text-sm">
          <Link to="/" className="text-slate-700 hover:text-white transition">
            Home
          </Link>

          <a href="#" className="text-slate-700 hover:text-white transition">
            Documentation
          </a>
        </div>
      </div>
    </nav>
  );
}
