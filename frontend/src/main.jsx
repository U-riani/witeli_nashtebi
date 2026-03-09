import { BrowserRouter } from "react-router-dom";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { BranchProvider } from "./context/BranchContext.jsx";

createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <BranchProvider>
      <App />
    </BranchProvider>
  </BrowserRouter>,
);
