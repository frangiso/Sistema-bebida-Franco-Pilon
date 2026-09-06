import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { useStaffSesion } from "../lib/staffAuth.js";
import { confirmarPagoEfectivo } from "../lib/callables.js";
import LoginEmail from "../components/LoginEmail.jsx";
import AppHeader from "../components/AppHeader.jsx";
import { colors, radius, boton, card, pageContainer } from "../theme.js";

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

  if (cargando) return <div style={pageContainer({ color: colors.textMuted })}>Cargando...</div>;
  if (!usuario) return <LoginEmail titulo="Caja" subtitulo="Pagos en efectivo" onLogin={login} error={error} />;

  if (seleccionado) {
    return (
      <div style={pageContainer()}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Confirmar cobro</h1>
        <div style={card({ padding: 20, marginTop: 16 })}>
          {seleccionado.items.map((item) => (
            <p key={item.productoId} style={{ fontSize: 17, fontWeight: 600, margin: "6px 0" }}>
              {item.cantidad}x {item.nombre}
            </p>
          ))}
          <p style={{ fontSize: 34, fontWeight: 800, marginTop: 12, color: colors.accentAlt }}>${seleccionado.montoTotal}</p>
          <p style={{ color: colors.textMuted, marginTop: 6 }}>Código: {seleccionado.codigoNumerico}</p>
        </div>
        {errorAccion && (
          <p style={{ color: colors.danger, background: colors.dangerBg, padding: 12, borderRadius: radius.sm, marginTop: 12 }}>
            {errorAccion}
          </p>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={() => setSeleccionado(null)} style={boton("secondary", { flex: 1, padding: 16 })}>
            Cancelar
          </button>
          <button
            disabled={confirmando}
            onClick={confirmarCobro}
            style={boton(confirmando ? "disabled" : "success", { flex: 1, padding: 16, fontSize: 16 })}
          >
            {confirmando ? "Confirmando..." : "✓ Ya cobré"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainer({ maxWidth: 560 })}>
      <AppHeader titulo="💵 Caja" subtitulo={usuario.nombre} onLogout={logout} />

      <h2 style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        Esperando cobro ({pedidos.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {pedidos.map((p) => (
          <div
            key={p.id}
            onClick={() => setSeleccionado(p)}
            style={card({
              padding: "14px 16px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              cursor: "pointer",
            })}
          >
            <span style={{ fontWeight: 700, fontSize: 16 }}>{p.codigoNumerico}</span>
            <span style={{ color: colors.textMuted }}>${p.montoTotal}</span>
          </div>
        ))}
        {pedidos.length === 0 && <p style={{ color: colors.textFaint, fontSize: 14 }}>No hay pagos en efectivo pendientes.</p>}
      </div>
    </div>
  );
}
