// frontend/src/components/Navbar.jsx

import { Link } from "react-router-dom";
import { useBranch } from "../context/BranchContext";
import { branches } from "../data/branches";

export default function Navbar() {
  const { branch, updateBranch } = useBranch();
  const SelectBranchId = branch?.id;

  const handleBranchChange = (e) => {
    const branchId = e.target.value;

    const branchData = branches.find((b) => b.id.toString() === branchId);

    updateBranch(branchData);
  };

  return (
    <nav className="sticky top-0 w-full bg-sky-300 text-slate-700 py-1 z-50">
      <div className="max-w-6xl mx-auto px-6 h-16 grid grid-cols-3">
        <Link to="/" className="flex items-center text-lg font-semibold">
          წითელი ნაშთები
        </Link>

        <div className="flex flex-col items-center justify-center">
          {!SelectBranchId && <p className="text-xl text-rose-500">გთხოვთ აირჩიეთ ფილიალი</p>}{" "}
          <select
            value={branch?.id || ""}
            onChange={handleBranchChange}
            className="px-3 py-2 rounded-md border bg-white text-sm"
          >
            <option value="">აირჩიეთ ფილიალი</option>

            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.brand})
              </option>
            ))}
          </select>
        </div>

        <div className="flex justify-end items-center">
          <Link to="/">Home</Link>
        </div>
      </div>
    </nav>
  );
}
