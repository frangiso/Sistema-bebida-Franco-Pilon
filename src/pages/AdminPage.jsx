import { useState } from "react";
import { useAdminSesion } from "../lib/adminAuth.js";
import LoginEmail from "../components/LoginEmail.jsx";
import AppHeader from "../components/AppHeader.jsx";
import PanelVivo from "./admin/PanelVivo.jsx";
import PanelHistorico from "./admin/PanelHistorico.jsx";
import PanelCatalogo from "./admin/PanelCatalogo.jsx";
import PanelStaff from "./admin/PanelStaff.jsx";
import { colors, radius, pageContainer } from "../theme.js";

const TABS = [
  { id: "vivo", label: "📊 En vivo" },
  { id: "historico", label: "📅 Histórico" },
  { id: "catalogo", label: "🍹 Catálogo" },
  { id: "staff", label: "👥 Staff" },
];

export default function AdminPage() {
  const { usuario, cargando, error, login, logout } = useAdminSesion();
  const [tab, setTab] = useState("vivo");

  if (cargando) return <div style={pageContainer({ color: colors.textMuted })}>Cargando...</div>;
  if (!usuario) return <LoginEmail titulo="Panel Dueño" subtitulo="Acceso administrador" onLogin={login} error={error} />;

  return (
    <div style={pageContainer({ maxWidth: 900 })}>
      <AppHeader titulo="Panel Dueño" subtitulo={usuario.email} onLogout={logout} />

      <div style={{ display: "flex", gap: 8, marginBottom: 24, overflowX: "auto", paddingBottom: 4 }}>
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: "10px 18px",
              borderRadius: radius.pill,
              border: "none",
              background: tab === t.id ? colors.gradient : colors.surface,
              color: "#fff",
              fontWeight: 700,
              fontSize: 14,
              whiteSpace: "nowrap",
              flexShrink: 0,
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
