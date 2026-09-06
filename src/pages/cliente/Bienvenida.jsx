import { useState } from "react";
import { Link } from "react-router-dom";
import { colors, radius, shadow, boton, card, pageContainer } from "../../theme.js";

const ROLES_STAFF = [
  { path: "/bartender", label: "Bartender", icono: "🍹" },
  { path: "/cajero", label: "Caja", icono: "💵" },
  { path: "/admin", label: "Dueño / Admin", icono: "🔑" },
];

// Pantalla de entrada al escanear el QR o abrir el link del local: primero
// pregunta si sos cliente (vas directo a pedir) o staff (te manda a loguearte
// a tu panel correspondiente), en vez de tirarte directo al catálogo.
export default function Bienvenida({ onPedir }) {
  const [mostrarStaff, setMostrarStaff] = useState(false);

  return (
    <div
      style={pageContainer({
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
      })}
    >
      <div
        style={{
          width: 72,
          height: 72,
          marginBottom: 18,
          borderRadius: radius.lg,
          background: colors.gradient,
          boxShadow: shadow.glow,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 34,
        }}
      >
        🍹
      </div>
      <h1 style={{ fontSize: 28, fontWeight: 800, margin: 0, letterSpacing: -0.4 }}>¡Bienvenido!</h1>
      <p style={{ color: colors.textMuted, fontSize: 15, marginTop: 8, marginBottom: 32, maxWidth: 300 }}>
        Pedí tu trago sin hacer fila y retiralo cuando esté listo.
      </p>

      <button onClick={onPedir} style={boton("primary", { width: "100%", maxWidth: 300, padding: 18, fontSize: 17 })}>
        🍸 Quiero pedir un trago
      </button>

      <div style={{ marginTop: 28, width: "100%", maxWidth: 300 }}>
        {!mostrarStaff ? (
          <button
            onClick={() => setMostrarStaff(true)}
            style={{ background: "none", border: "none", color: colors.textMuted, fontSize: 13, cursor: "pointer" }}
          >
            ¿Trabajás acá? Iniciar sesión
          </button>
        ) : (
          <div style={card({ padding: 16, textAlign: "left" })}>
            <p style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700, marginBottom: 10, textTransform: "uppercase" }}>
              Ingresar como staff
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {ROLES_STAFF.map((rol) => (
                <Link
                  key={rol.path}
                  to={rol.path}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: radius.sm,
                    background: colors.surfaceStrong,
                    color: colors.text,
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{rol.icono}</span> {rol.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
