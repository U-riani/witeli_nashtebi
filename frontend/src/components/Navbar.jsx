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
    <nav className="sticky top-0 w-full bg-sky-300 text-slate-700 py-1">
      <div className="max-w-6xl mx-auto px-6 h-16 grid grid-cols-3 grid-rows-1">
        {/* Left side */}
        <Link
          to="/"
          className="flex items-center text-start text-lg font-semibold tracking-tight hover:text-indigo-600 transition"
        >
          წითელი ნაშთები
        </Link>

        {/* Center branch selector */}
        <div className="flex items-center">
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
        </div>

        {/* Right side */}
        <div className="flex justify-end items-center gap-6 text-sm">
          <Link to="/" className=" text-slate-700 hover:text-white transition">
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
