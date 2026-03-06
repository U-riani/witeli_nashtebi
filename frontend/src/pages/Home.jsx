// frontend/src/pages/Home.jsx

import { useState } from "react";
import { branches } from "../data/branches";

export default function Home() {
  const [witeli, setWiteli] = useState(null);
  const [cnobari, setCnobari] = useState(null);
  const [live, setLive] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleUpload = async () => {
    if (!witeli || !cnobari || !live) {
      alert("Please upload all 3 files.");
      return;
    }

    const formData = new FormData();
    formData.append("witeli", witeli);
    formData.append("cnobari", cnobari);
    formData.append("live", live);

    try {
      setLoading(true);

      const response = await fetch("http://localhost:8000/api/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "inventory_result.xlsx";
      a.click();

      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error(err);
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (

      <div className="max-w-xl mx-auto">

        <div className="bg-lime-50 border border-gray-800 rounded-xl p-8 shadow-xl">

          <h1 className="text-2xl font-semibold mb-2 text-slate-800">
            Inventory Reconciliation
          </h1>

          <p className="text-gray-400 mb-8 text-sm">
            Upload store files and generate reconciliation sheet.
          </p>

          <div className="space-y-4">

            <div>
              <label className="block text-sm text-slate-800 mb-1">
                Witeli Nashtebi
              </label>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setWiteli(e.target.files[0])}
                className="w-full text-sm file:bg-lime-500 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-md file:mr-4 bg-lime-200 rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-800 mb-1">
                Cnobari
              </label>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setCnobari(e.target.files[0])}
                className="w-full text-sm file:bg-lime-500 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-md file:mr-4 bg-lime-200 rounded-md p-2"
              />
            </div>

            <div>
              <label className="block text-sm text-slate-800 mb-1">
                Live Nashtebi
              </label>
              <input
                type="file"
                accept=".xlsx"
                onChange={(e) => setLive(e.target.files[0])}
                className="w-full text-sm file:bg-lime-500 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-md file:mr-4 bg-lime-200 rounded-md p-2"
              />
            </div>

          </div>

          <button
            onClick={handleUpload}
            disabled={loading}
            className="mt-8 w-full bg-sky-200 text-slate-700 hover:bg-sky-500 hover:text-white transition rounded-lg py-3 text-sm font-medium disabled:opacity-50"
          >
            {loading ? "Processing..." : "Generate Excel"}
          </button>

        </div>

      </div>

  );
}