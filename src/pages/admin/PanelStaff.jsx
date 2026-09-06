import { useEffect, useState } from "react";
import { collection, doc, updateDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase.js";
import { crearUsuarioStaff, cambiarPinStaff, eliminarUsuarioStaff } from "../../lib/callables.js";

const ROLES = ["bartender", "cajero"];

const inputStyle = { padding: 8, fontSize: 14, background: "#222", border: "1px solid #444", borderRadius: 6, color: "#fff" };
const vacio = { nombre: "", usuario: "", pin: "", rol: ROLES[0] };

export default function PanelStaff({ adminUid }) {
  const [usuarios, setUsuarios] = useState([]);
  const [nuevo, setNuevo] = useState(vacio);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "usuarios"), orderBy("nombre", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setUsuarios(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  async function agregarUsuario(e) {
    e.preventDefault();
    setError(null);
    if (!nuevo.nombre || !nuevo.usuario || !nuevo.pin) return;
    setGuardando(true);
    try {
      await crearUsuarioStaff(nuevo);
      setNuevo(vacio);
    } catch (err) {
      setError(err.message || "No se pudo crear el usuario.");
    } finally {
      setGuardando(false);
    }
  }

  function toggleActivo(usuarioId, activo) {
    updateDoc(doc(db, "usuarios", usuarioId), { activo: !activo });
  }

  async function cambiarPin(usuarioId) {
    const pin = prompt("Nuevo PIN (4 a 6 dígitos):");
    if (!pin) return;
    try {
      await cambiarPinStaff({ usuarioId, pin });
    } catch (err) {
      alert(err.message || "No se pudo cambiar el PIN.");
    }
  }

  async function eliminar(usuarioId, nombre) {
    if (!confirm(`¿Eliminar a ${nombre}? No va a poder volver a loguearse.`)) return;
    try {
      await eliminarUsuarioStaff({ usuarioId });
    } catch (err) {
      alert(err.message || "No se pudo eliminar el usuario.");
    }
  }

  return (
    <div>
      <form onSubmit={agregarUsuario} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} style={inputStyle} />
        <input
          placeholder="Usuario (login)"
          value={nuevo.usuario}
          onChange={(e) => setNuevo({ ...nuevo, usuario: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="PIN (4-6 dígitos)"
          inputMode="numeric"
          value={nuevo.pin}
          onChange={(e) => setNuevo({ ...nuevo, pin: e.target.value })}
          style={{ ...inputStyle, width: 130 }}
        />
        <select value={nuevo.rol} onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })} style={inputStyle}>
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button type="submit" disabled={guardando} style={{ padding: "8px 16px", background: "#2d7", border: "none", borderRadius: 6, color: "#fff" }}>
          {guardando ? "Creando..." : "Crear"}
        </button>
      </form>
      {error && <p style={{ color: "#f66", marginBottom: 16 }}>{error}</p>}

      {usuarios.map((u) => (
        <div key={u.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ flex: 1, opacity: u.activo ? 1 : 0.4 }}>
            {u.nombre} <span style={{ color: "#888", fontSize: 12 }}>@{u.usuario} — {u.rol}</span>
          </span>
          {u.rol !== "admin" && (
            <>
              <button
                onClick={() => toggleActivo(u.id, u.activo)}
                style={{ padding: "6px 10px", background: u.activo ? "#2d7" : "#555", border: "none", borderRadius: 6, color: "#fff" }}
              >
                {u.activo ? "Activo" : "Inactivo"}
              </button>
              <button onClick={() => cambiarPin(u.id)} style={{ padding: "6px 10px", background: "#448", border: "none", borderRadius: 6, color: "#fff" }}>
                Cambiar PIN
              </button>
            </>
          )}
          {u.id !== adminUid && (
            <button onClick={() => eliminar(u.id, u.nombre)} style={{ padding: "6px 10px", background: "#a33", border: "none", borderRadius: 6, color: "#fff" }}>
              Eliminar
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
