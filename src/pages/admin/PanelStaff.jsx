import { useEffect, useState } from "react";
import { createUserWithEmailAndPassword, sendPasswordResetEmail, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from "firebase/firestore";
import { auth, authSecundario, db } from "../../firebase.js";
import { colors, boton, input, card } from "../../theme.js";

const ROLES = ["bartender", "cajero"];
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
      <form onSubmit={agregarUsuario} style={card({ padding: 18, marginBottom: 20 })}>
        <p style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
          Nueva cuenta de staff
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            style={input({ flex: "1 1 160px", width: "auto" })}
          />
          <input
            placeholder="Email"
            type="email"
            value={nuevo.email}
            onChange={(e) => setNuevo({ ...nuevo, email: e.target.value })}
            style={input({ flex: "1 1 200px", width: "auto" })}
          />
          <input
            placeholder="Contraseña"
            type="password"
            value={nuevo.password}
            onChange={(e) => setNuevo({ ...nuevo, password: e.target.value })}
            style={input({ flex: "1 1 160px", width: "auto" })}
          />
          <select
            value={nuevo.rol}
            onChange={(e) => setNuevo({ ...nuevo, rol: e.target.value })}
            style={input({ flex: "1 1 130px", width: "auto" })}
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <button type="submit" disabled={guardando} style={boton(guardando ? "disabled" : "primary", { flex: "1 1 120px" })}>
            {guardando ? "Creando..." : "Crear"}
          </button>
        </div>
        {error && <p style={{ color: colors.danger, marginTop: 12, fontSize: 13 }}>{error}</p>}
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {usuarios.map((u) => (
          <div
            key={u.id}
            style={card({
              display: "flex",
              alignItems: "center",
              gap: 10,
              padding: "12px 16px",
              flexWrap: "wrap",
              opacity: u.activo ? 1 : 0.5,
            })}
          >
            <span style={{ flex: "1 1 200px" }}>
              <div style={{ fontWeight: 700 }}>{u.nombre}</div>
              <div style={{ color: colors.textMuted, fontSize: 12 }}>
                {u.email} — {u.rol}
              </div>
            </span>
            {u.rol !== "admin" && (
              <>
                <button
                  onClick={() => toggleActivo(u.id, u.activo)}
                  style={boton(u.activo ? "success" : "secondary", { padding: "8px 14px", fontSize: 13 })}
                >
                  {u.activo ? "Activo" : "Inactivo"}
                </button>
                <button
                  onClick={() => restablecerContrasena(u.email)}
                  style={boton("secondary", { padding: "8px 14px", fontSize: 13 })}
                >
                  Restablecer contraseña
                </button>
              </>
            )}
            {u.id !== adminUid && (
              <button onClick={() => eliminar(u.id, u.nombre)} style={boton("danger", { padding: "8px 14px", fontSize: 13 })}>
                Eliminar
              </button>
            )}
          </div>
        ))}
        {usuarios.length === 0 && <p style={{ color: colors.textFaint, fontSize: 14 }}>Todavía no hay usuarios cargados.</p>}
      </div>
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
