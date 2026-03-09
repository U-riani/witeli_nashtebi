// frontend/src/context/BranchContext.jsx

import { createContext, useContext, useEffect, useState } from "react";

const BranchContext = createContext();

export function BranchProvider({ children }) {
  const [branch, setBranch] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem("selectedBranchData");

    if (saved && saved !== "undefined") {
      try {
        setBranch(JSON.parse(saved));
      } catch {
        localStorage.removeItem("selectedBranchData");
      }
    }
  }, []);

  const updateBranch = (branchData) => {
    setBranch(branchData);

    if (branchData) {
      localStorage.setItem("selectedBranchData", JSON.stringify(branchData));
      localStorage.setItem("selectedBranch", branchData.id);
    } else {
      localStorage.removeItem("selectedBranchData");
      localStorage.removeItem("selectedBranch");
    }
  };

  return (
    <BranchContext.Provider value={{ branch, updateBranch }}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranch() {
  return useContext(BranchContext);
}