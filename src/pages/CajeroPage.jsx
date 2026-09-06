import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { useStaffSesion } from "../lib/staffAuth.js";
import { confirmarPagoEfectivo } from "../lib/callables.js";
import LoginPin from "../components/LoginPin.jsx";

export default function CajeroPage() {
  const { usuario, cargando, error, login, logout } = useStaffSesion("cajero");
  const [pedidos, setPedidos] = useState([]);
  const [seleccionado, setSeleccionado] = useState(null);
  const [errorAccion, setErrorAccion] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    const q = query(
      collection(db, "pedidos"),
      where("estado", "==", "pendientePago"),
      where("metodoPago", "==", "efectivo"),
      orderBy("creadoEn", "asc")
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [usuario]);

  async function confirmarCobro() {
    if (!seleccionado) return;
    setConfirmando(true);
    setErrorAccion(null);
    try {
      await confirmarPagoEfectivo({ pedidoId: seleccionado.id });
      setSeleccionado(null);
    } catch (err) {
      setErrorAccion(err.message || "No se pudo confirmar el cobro.");
    } finally {
      setConfirmando(false);
    }
  }

  if (cargando) return <div style={{ padding: 24, color: "#aaa" }}>Cargando...</div>;
  if (!usuario) return <LoginPin titulo="Caja" onLogin={login} error={error} />;

  if (seleccionado) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Confirmar cobro</h1>
        <div style={{ background: "#1a1a1a", padding: 16, borderRadius: 12, marginTop: 16 }}>
          {seleccionado.items.map((item) => (
            <p key={item.productoId} style={{ fontSize: 18 }}>
              {item.cantidad}x {item.nombre}
            </p>
          ))}
          <p style={{ fontSize: 32, fontWeight: 700, marginTop: 12 }}>${seleccionado.montoTotal}</p>
          <p style={{ color: "#888", marginTop: 8 }}>Código: {seleccionado.codigoNumerico}</p>
        </div>
        {errorAccion && <p style={{ color: "#f66" }}>{errorAccion}</p>}
        <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
          <button
            onClick={() => setSeleccionado(null)}
            style={{ flex: 1, padding: 14, borderRadius: 8, background: "#333", color: "#fff", border: "none" }}
          >
            Cancelar
          </button>
          <button
            disabled={confirmando}
            onClick={confirmarCobro}
            style={{ flex: 1, padding: 14, borderRadius: 8, background: confirmando ? "#333" : "#2d7", color: "#fff", border: "none" }}
          >
            {confirmando ? "Confirmando..." : "Ya cobré, confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Caja - Pagos en efectivo</h1>
        <button onClick={logout} style={{ background: "none", border: "none", color: "#888" }}>
          Salir
        </button>
      </div>

      <h2 style={{ fontSize: 14, color: "#888", marginTop: 24 }}>Esperando cobro ({pedidos.length})</h2>
      {pedidos.map((p) => (
        <div key={p.id} onClick={() => setSeleccionado(p)} style={{ padding: 12, borderBottom: "1px solid #2a2a2a", cursor: "pointer" }}>
          <strong>{p.codigoNumerico}</strong> — ${p.montoTotal}
        </div>
      ))}
    </div>
  );
}
