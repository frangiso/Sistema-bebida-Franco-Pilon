import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ClientePage from "./pages/ClientePage.jsx";
import BartenderPage from "./pages/BartenderPage.jsx";
import CajeroPage from "./pages/CajeroPage.jsx";
import AdminPage from "./pages/AdminPage.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ClientePage />} />
        <Route path="/bartender" element={<BartenderPage />} />
        <Route path="/cajero" element={<CajeroPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
