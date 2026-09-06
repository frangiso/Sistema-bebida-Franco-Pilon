import { useState } from "react";
import { useAdminSesion } from "../lib/adminAuth.js";
import LoginEmail from "../components/LoginEmail.jsx";
import PanelVivo from "./admin/PanelVivo.jsx";
import PanelHistorico from "./admin/PanelHistorico.jsx";
import PanelCatalogo from "./admin/PanelCatalogo.jsx";
import PanelStaff from "./admin/PanelStaff.jsx";

const TABS = [
  { id: "vivo", label: "En vivo" },
  { id: "historico", label: "Histórico" },
  { id: "catalogo", label: "Catálogo" },
  { id: "staff", label: "Staff" },
];

export default function AdminPage() {
  const { usuario, cargando, error, login, logout } = useAdminSesion();
  const [tab, setTab] = useState("vivo");

  if (cargando) return <div style={{ padding: 24, color: "#aaa" }}>Cargando...</div>;
  if (!usuario) return <LoginEmail titulo="Panel Dueño/Admin" onLogin={login} error={error} />;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <h1 style={{ fontSize: 20 }}>Panel Dueño</h1>
        <button onClick={logout} style={{ background: "none", border: "none", color: "#888" }}>
          Salir ({usuario.email})
        </button>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: tab === t.id ? "2px solid #2d7" : "1px solid #444",
              background: tab === t.id ? "#173" : "#222",
              color: "#fff",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "vivo" && <PanelVivo />}
      {tab === "historico" && <PanelHistorico />}
      {tab === "catalogo" && <PanelCatalogo />}
      {tab === "staff" && <PanelStaff adminUid={usuario.uid} />}
    </div>
  );
}
