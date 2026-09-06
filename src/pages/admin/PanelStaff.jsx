import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { auth, authSecundario, db } from "../../firebase.js";

const ROLES = ["bartender", "cajero"];

const inputStyle = { padding: 8, fontSize: 14, background: "#222", border: "1px solid #444", borderRadius: 6, color: "#fff" };
const vacio = { nombre: "", email: "", password: "", rol: ROLES[0] };

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
    if (!nuevo.nombre || !nuevo.email || !nuevo.password) return;
    setGuardando(true);
    try {
      // Se crea con una instancia de Auth aparte para que no reemplace la
      // sesión del admin logueado en esta pestaña.
      const cred = await createUserWithEmailAndPassword(authSecundario, nuevo.email, nuevo.password);
      await setDoc(doc(db, "usuarios", cred.user.uid), {
        nombre: nuevo.nombre,
        email: nuevo.email,
        rol: nuevo.rol,
        activo: true,
      });
      await signOut(authSecundario);
      setNuevo(vacio);
    } catch (err) {
      setError(traducirError(err));
    } finally {
      setGuardando(false);
    }
  }

  function toggleActivo(usuarioId, activo) {
    updateDoc(doc(db, "usuarios", usuarioId), { activo: !activo });
  }

  async function restablecerContrasena(email) {
    try {
      await sendPasswordResetEmail(auth, email);
      alert(`Le mandamos un mail a ${email} para que elija una contraseña nueva.`);
    } catch (err) {
      alert(traducirError(err));
    }
  }

  async function eliminar(usuarioId, nombre) {
    if (!confirm(`¿Eliminar a ${nombre}? No va a poder volver a loguearse.`)) return;
    try {
      // Solo borra el documento (revoca el acceso al instante). La cuenta de
      // Auth queda huérfana pero inofensiva: sin documento no pasa el chequeo
      // de rol en ningún panel ni en las reglas de Firestore.
      await deleteDoc(doc(db, "usuarios", usuarioId));
    } catch (err) {
      alert(traducirError(err));
    }
  }

  return (
    <div>
      <form onSubmit={agregarUsuario} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16 }}>
        <input placeholder="Nombre" value={nuevo.nombre} onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })} style={inputStyle} />
        <input
          placeholder="Email"
          type="email"
          value={nuevo.email}
          onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
          style={inputStyle}
        />
        <input
          placeholder="Contraseña"
          type="password"
          value={nuevo.password}
          onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
          style={inputStyle}
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
            {u.nombre} <span style={{ color: "#888", fontSize: 12 }}>{u.email} — {u.rol}</span>
          </span>
          {u.rol !== "admin" && (
            <>
              <button
                onClick={() => toggleActivo(u.id, u.activo)}
                style={{ padding: "6px 10px", background: u.activo ? "#2d7" : "#555", border: "none", borderRadius: 6, color: "#fff" }}
              >
                {u.activo ? "Activo" : "Inactivo"}
              </button>
              <button onClick={() => restablecerContrasena(u.email)} style={{ padding: "6px 10px", background: "#448", border: "none", borderRadius: 6, color: "#fff" }}>
                Restablecer contraseña
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

function traducirError(err) {
  const codigo = err?.code || "";
  if (codigo === "auth/email-already-in-use") return "Ya existe una cuenta con ese email.";
  if (codigo === "auth/weak-password") return "La contraseña tiene que tener al menos 6 caracteres.";
  if (codigo === "auth/invalid-email") return "El email no es válido.";
  return err?.message || "No se pudo completar la operación.";
}
