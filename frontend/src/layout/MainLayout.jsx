// frontend/src/layout/MainLayout.jsx

import Navbar from "../components/Navbar";

export default function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-white">

      <Navbar />

      <main className="max-w-6xl mx-auto px-6 py-12">
        {children}
      </main>

    </div>
  );
}