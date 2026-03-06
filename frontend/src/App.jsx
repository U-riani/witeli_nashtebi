import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import MainLayout from "./layout/MainLayout";
import Admin from "./pages/Admin";

function App() {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin/" element={<Admin />} />
      </Routes>
    </MainLayout>
  );
}

export default App;
