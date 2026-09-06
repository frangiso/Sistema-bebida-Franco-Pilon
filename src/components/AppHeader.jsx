import { colors, radius } from "../theme.js";

export default function AppHeader({ titulo, subtitulo, onLogout }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24, gap: 12 }}>
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{titulo}</h1>
        {subtitulo && <p style={{ color: colors.textMuted, fontSize: 13, marginTop: 4 }}>{subtitulo}</p>}
      </div>
      {onLogout && (
        <button
          onClick={onLogout}
          style={{
            background: colors.surfaceStrong,
            border: "none",
            color: colors.textMuted,
            padding: "9px 16px",
            borderRadius: radius.pill,
            fontSize: 13,
            fontWeight: 700,
            whiteSpace: "nowrap",
          }}
        >
          Salir
        </button>
      )}
    </div>
  );
}
