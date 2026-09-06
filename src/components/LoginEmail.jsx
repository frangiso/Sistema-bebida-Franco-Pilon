import { useState } from "react";

const inputStyle = {
  display: "block",
  width: "100%",
  padding: 12,
  marginBottom: 10,
  fontSize: 16,
  background: "#222",
  border: "1px solid #444",
  borderRadius: 8,
  color: "#fff",
};

export default function LoginEmail({ titulo, onLogin, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function enviar(e) {
    e.preventDefault();
    onLogin(email, password);
  }

  return (
    <form onSubmit={enviar} style={{ padding: 24, maxWidth: 320 }}>
      <h1 style={{ fontSize: 20, marginBottom: 16 }}>{titulo}</h1>
      <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />
      <input
        type="password"
        placeholder="Contraseña"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        style={inputStyle}
      />
      {error && <p style={{ color: "#f66", fontSize: 14 }}>{error}</p>}
      <button
        type="submit"
        style={{ width: "100%", padding: 12, fontSize: 16, background: "#2d7", color: "#fff", border: "none", borderRadius: 8 }}
      >
        Ingresar
      </button>
    </form>
  );
}
