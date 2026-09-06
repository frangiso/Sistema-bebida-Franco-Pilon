import { useState } from "react";
import { Link } from "react-router-dom";
import { colors, radius, shadow, boton, input, card } from "../theme.js";

export default function LoginEmail({ titulo, subtitulo, onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [enviando, setEnviando] = useState(false);

  async function enviar(e) {
    e.preventDefault();
    if (!email || !password) return;
    setEnviando(true);
    try {
      await onLogin(email, password);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px 20px",
      }}
    >
      <div style={{ width: "100%", maxWidth: 380 }}>
        <Link
          to="/"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: colors.textMuted,
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          ← Volver al inicio
        </Link>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div
            style={{
              width: 64,
              height: 64,
              margin: "0 auto 16px",
              borderRadius: radius.lg,
              background: colors.gradient,
              boxShadow: shadow.glow,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 30,
            }}
          >
            🍹
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: -0.3 }}>{titulo}</h1>
          <p style={{ color: colors.textMuted, fontSize: 14, marginTop: 6 }}>
            {subtitulo || "Ingresá con tu cuenta para continuar"}
          </p>
        </div>

        <form onSubmit={enviar} style={card({ padding: 24 })}>
          <label style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, marginBottom: 6, display: "block" }}>
            Email
          </label>
          <input
            type="email"
            autoComplete="username"
            placeholder="tu@mail.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={input({ marginBottom: 16 })}
          />
          <label style={{ fontSize: 12, color: colors.textMuted, fontWeight: 600, marginBottom: 6, display: "block" }}>
            Contraseña
          </label>
          <input
            type="password"
            autoComplete="current-password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={input({ marginBottom: error ? 12 : 20 })}
          />

          {error && (
            <p
              style={{
                background: colors.dangerBg,
                color: colors.danger,
                borderRadius: radius.sm,
                padding: "10px 12px",
                fontSize: 13,
                marginBottom: 16,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={enviando}
            style={boton(enviando ? "disabled" : "primary", { width: "100%", padding: 15, fontSize: 16 })}
          >
            {enviando ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>
    </div>
  );
}
