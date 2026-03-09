// frontend/src/pages/Admin.jsx

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function Admin() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, []);

  async function loadFiles() {
    setLoading(true);

    try {
      const { data, error } = await supabase.storage
        .from("inventory-results")
        .list("", { limit: 1000 });

      console.log("STORAGE RESPONSE:", data);
      console.log("STORAGE ERROR:", error);

      console.log("Supabase files:", data);

      if (error) {
        console.error(error);
        return;
      }

      if (!data || data.length === 0) {
        setFiles([]);
        return;
      }

      const mapped = data.map((file) => {
        // Extract branch name from filename
        const parts = file.name.split("-");
        const branch = parts.slice(0, parts.length - 3).join(" ");

        return {
          branch,
          name: file.name,
          path: file.name,
          created:
            file.created_at || file.updated_at || new Date().toISOString(),
        };
      });

      mapped.sort((a, b) => new Date(b.created) - new Date(a.created));

      setFiles(mapped);
    } catch (err) {
      console.error("Unexpected error:", err);
    } finally {
      setLoading(false);
    }
  }

  function downloadFile(path) {
    const { data } = supabase.storage
      .from("inventory-results")
      .getPublicUrl(path);

    if (data?.publicUrl) {
      window.open(data.publicUrl, "_blank");
    }
  }

  async function handleAutoAlign(file) {
    try {
      const { data } = supabase.storage
        .from("inventory-results")
        .getPublicUrl(file.path);

      const response = await fetch(
        "https://witeli-nashtebi.onrender.com/api/auto-align",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileUrl: data.publicUrl,
          }),
        },
      );

      if (!response.ok) throw new Error("Auto align failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "auto_align.xlsx";
      a.click();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Auto align failed");
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-8">
      <h1 className="text-2xl font-semibold mb-6">
        Admin – Uploaded Reconciliation Files
      </h1>

      {loading && <p>Loading files...</p>}

      {!loading && files.length === 0 && <p>No files uploaded yet.</p>}

      {!loading && files.length > 0 && (
        <table className="w-full border border-gray-300 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr className="text-left text-sm">
              <th className="p-3">Branch</th>
              <th className="p-3">File</th>
              <th className="p-3">Date</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>

          <tbody>
            {files.map((file, i) => (
              <tr key={i} className="border-t">
                <td className="p-3 text-sm">{file.branch}</td>

                <td className="p-3 text-sm">{file.name}</td>

                <td className="p-3 text-sm">
                  {new Date(file.created).toLocaleString()}
                </td>

                <td className="p-3 flex flex-col lg:flex-row gap-2">
                  <button
                    onClick={() => downloadFile(file.path)}
                    className="bg-sky-500 text-white px-3 py-1 rounded-md text-sm hover:bg-sky-600"
                  >
                    Download
                  </button>
                  <button
                    onClick={() => handleAutoAlign(file)}
                    className="text-nowrap bg-lime-500 text-white px-3 py-1 rounded-md text-sm hover:bg-lime-600"
                  >
                    Auto Align
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
