// frontend/src/pages/Home.jsx
import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { useBranch } from "../context/BranchContext";

export default function Home() {
  const [witeli, setWiteli] = useState(null);
  const [cnobari, setCnobari] = useState(null);
  const [live, setLive] = useState(null);

  const [finalFile, setFinalFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const { branch } = useBranch();
  const branchId = branch?.id;

  const videoSectionRef = useRef(null);
  // --------------------------------------------
  // Generate reconciliation Excel
  // --------------------------------------------

  const handleScrollToVideos = () => {
    videoSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleGenerate = async () => {
    if (!branchId) {
      alert("გთხოვთ აირჩიოთ ფილიალი.");
      return;
    }

    if (!witeli) {
      alert("გთხოვს აირჩიეთ წითელი ნაშთების ექსელის ფაილი");
      return;
    }
    if (!cnobari) {
      alert("გთხოვს აირჩიეთ ცნობარის ექსელის ფაილი");
      return;
    }
    if (!live) {
      alert("გთხოვს აირჩიეთ live ნაშთების ექსელის ფაილი");
      return;
    }

    const formData = new FormData();
    formData.append("witeli", witeli);
    formData.append("cnobari", cnobari);
    formData.append("live", live);

    try {
      setLoading(true);

      const response = await fetch(
        "http://127.0.0.1:8000/api/upload",
        {
          method: "POST",
          body: formData,
        },
      );

      if (!response.ok) {
        const error = await response.json();
        alert(error.detail || "ფაილის დამუშავება ვერ მოხერხდა");
        return;
      }
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

  // --------------------------------------------
  // Upload final reconciled file to Supabase
  // --------------------------------------------

  const handleUploadResult = async () => {
    if (!finalFile) {
      alert("გთხოვთ აირჩიეთ საბოლლო შედეგის ფაილი თქვენ მიერ გადათვლილი");
      return;
    }

    if (!branchId) {
      alert("გთხოვთ აირჩიეთ ფილიალი");
      return;
    }

    try {
      setUploading(true);

      if (!branch) {
        alert("Branch information missing.");
        return;
      }

      const branchSlug = branch.name.replaceAll(" ", "-").toLowerCase();

      const today = new Date().toISOString().split("T")[0];

      const fileName = `${branchSlug}-${today}-${Date.now()}.xlsx`;

      const { data, error } = await supabase.storage
        .from("inventory-results")
        .upload(fileName, finalFile, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) throw error;

      alert("File uploaded successfully!");

      console.log("Uploaded:", data);
    } catch (err) {
      console.error(err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className=" space-y-5">
      <div className="max-w-xl  mx-auto bg-lime-50 border border-gray-800 rounded-xl p-8 shadow-xl">
        <h1 className="text-2xl font-semibold mb-2 text-slate-800">
          აღწერის ფაილის გენერირება
        </h1>
        <div className="flex gap-1 py-2">
          <div className="">*</div>
          <p className="text-gray-400">
            ფაილების ჩამოსატვირთვად იხილეთ{" "}
            <span
              onClick={handleScrollToVideos}
              className="underline text-gray-600 cursor-pointer"
            >
              ვიდეო ინსტრუქცია
            </span>
          </p>
        </div>
        {/* ----------------------- */}
        {/* Input Files */}
        {/* ----------------------- */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm text-slate-800 mb-1">
              წითელი ნაშთები (ატვირთეთ ექსელის ფაილი)
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
              ცნობარი (ატვირთეთ ექსელის ფაილი)
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
              live ნაშთები (ატვირთეთ ექსელის ფაილი)
            </label>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setLive(e.target.files[0])}
              className="mb-8 w-full text-sm file:bg-lime-500 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-md file:mr-4 bg-lime-200 rounded-md p-2"
            />
          </div>
        </div>
        {/* ----------------------- */}
        {/* Generate Excel */}
        {/* ----------------------- */}
        {!branchId && (
          <p className="text-rose-500">გთხოვთ აირჩიეთ ფილიალი</p>
        )}{" "}
        <button
          onClick={handleGenerate}
          disabled={loading || !branchId}
          className=" w-full bg-lime-700 text-slate-100 hover:bg-lime-900 hover:text-white transition rounded-lg py-3 text-sm font-medium disabled:opacity-50 cursor-pointer"
        >
          {loading ? "მუშაოვდება (დაელოდეთ) ..." : "აღწერის ფაილის გენერირება"}
        </button>
        {loading && <p className="text-center pt-2 text-gray-500">პროცესი შეიძლება გაგრძელდეს რამდენიმე წუთი</p>}
        {/* ----------------------- */}
        {/* Upload Final Result */}
        {/* ----------------------- */}
        <div className="mt-10 border-t pt-6">
          <h2 className="text-2xl font-semibold text-slate-800 mb-2">
            შედეგები
          </h2>
          <div className="flex gap-1">
            <div>*</div>
            <p className="text-red-500">
              ფაილში შეავსეთ მხოლოდ "რეალური ნაშთის" სვეტი.
            </p>
          </div>
          <div className="flex gap-1">
            <div>*</div>
            <p className="text-sky-500">
              თუ კონკრეტული აქრტიკული კოდის ნაშთი ძალიან ბევრია აღწერეთ მხოლოდ
              წითელ ნაშთში გასული ბარკოდის ფერის შესაბამისი პროდუქტები.
              <strong className="ps-2 text-sky-800">
                დანარჩენი უჯრები დატოეთ ცარიელი!
              </strong>
            </p>
          </div>
          <div className="flex flex-col py-4 gap-2">
            <p className="text-gray-500">ატვირთეთ შევსებული ექსელის ფაილი</p>
            <input
              type="file"
              accept=".xlsx"
              onChange={(e) => setFinalFile(e.target.files[0])}
              className="mb-4 w-full text-sm file:bg-indigo-500 file:border-0 file:text-white file:px-4 file:py-2 file:rounded-md file:mr-4 bg-indigo-100 rounded-md p-2"
            />
          </div>
          {!branchId && <p className="text-rose-500">გთხოვთ აირჩიეთ ფილიალი</p>}{" "}
          <button
            onClick={handleUploadResult}
            disabled={uploading || !branchId}
            className=" w-full bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg py-3 text-sm font-medium disabled:opacity-50 cursor-pointer"
          >
            {uploading ? "იტვირთება..." : "შედეგების ფაილის გაგზავნა"}
          </button>
        </div>
      </div>
      <div ref={videoSectionRef} className="w-full flex gap-3 items-stretch">
        <div className="flex flex-col flex-1 justify-between h-full">
          <p className="text-xl text-center h-[3rem] flex items-center justify-center">
            წითელი ნაშთები
          </p>

          <video
            src="/videos/witeli-nashtebi.mp4"
            controls
            className="w-full rounded-lg"
          />
        </div>

        <div className="flex flex-col flex-1 justify-between h-full">
          <p className="text-xl text-center h-[3rem] flex items-center justify-center">
            ცნობარი
          </p>

          <video
            src="/videos/cnobaris-chawera.mp4"
            controls
            className="w-full rounded-lg"
          />
        </div>

        <div className="flex flex-col flex-1 justify-between h-full">
          <p className="text-xl text-center h-[3rem] flex items-center justify-center">
            live ნაშთები
          </p>

          <video
            src="/videos/live-nashtebis-chawera.mp4"
            controls
            className="w-full rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
