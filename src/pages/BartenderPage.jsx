import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { useStaffSesion } from "../lib/staffAuth.js";
import { confirmarEntrega } from "../lib/callables.js";
import LoginEmail from "../components/LoginEmail.jsx";
import AppHeader from "../components/AppHeader.jsx";
import EscanerQR from "../components/EscanerQR.jsx";
import { colors, radius, boton, card, pageContainer } from "../theme.js";

export default function BartenderPage() {
  const { usuario, cargando, error, login, logout } = useStaffSesion("bartender");
  const [pedidos, setPedidos] = useState([]);
  const [codigoInput, setCodigoInput] = useState("");
  const [seleccionado, setSeleccionado] = useState(null);
  const [mostrarCamara, setMostrarCamara] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const [confirmando, setConfirmando] = useState(false);

  useEffect(() => {
    if (!usuario) return;
    // FIFO: el que paga primero se retira primero.
    const q = query(collection(db, "pedidos"), where("estado", "in", ["pendienteRetiro", "demorado"]), orderBy("pagadoEn", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return unsubscribe;
  }, [usuario]);

  function buscarPorCodigo() {
    const encontrado = pedidos.find((p) => p.codigoNumerico === codigoInput.trim());
    if (!encontrado) {
      setErrorAccion("Código no encontrado en la cola de retiro.");
      return;
    }
    setErrorAccion(null);
    setSeleccionado(encontrado);
  }

  function alEscanear(qrPayload) {
    setMostrarCamara(false);
    const encontrado = pedidos.find((p) => p.id === qrPayload);
    // Aunque no esté todavía en la cola local (listener con lag), igual
    // dejamos intentar: confirmarEntrega valida contra Firestore posta.
    setSeleccionado(encontrado || { id: qrPayload, items: [], montoTotal: null });
    setErrorAccion(null);
  }

  async function confirmar() {
    if (!seleccionado) return;
    setConfirmando(true);
    setErrorAccion(null);
    try {
      await confirmarEntrega({ pedidoId: seleccionado.id });
      setSeleccionado(null);
      setCodigoInput("");
    } catch (err) {
      setErrorAccion(err.message || "No se pudo confirmar la entrega.");
    } finally {
      setConfirmando(false);
    }
  }

  if (cargando) return <div style={pageContainer({ color: colors.textMuted })}>Cargando...</div>;
  if (!usuario) return <LoginEmail titulo="Bartender" subtitulo="Barra de retiro" onLogin={login} error={error} />;

  if (seleccionado) {
    return (
      <div style={pageContainer()}>
        <h1 style={{ fontSize: 20, fontWeight: 800 }}>Confirmar entrega</h1>
        <div style={card({ padding: 20, marginTop: 16 })}>
          {seleccionado.items.length === 0 && <p style={{ color: colors.textMuted }}>(detalle no disponible todavía)</p>}
          {seleccionado.items.map((item) => (
            <p key={item.productoId} style={{ fontSize: 17, fontWeight: 600, margin: "6px 0" }}>
              {item.cantidad}x {item.nombre}
            </p>
          ))}
          <p style={{ fontSize: 30, fontWeight: 800, marginTop: 12, color: colors.accentAlt }}>
            {seleccionado.montoTotal != null ? `$${seleccionado.montoTotal}` : ""}
          </p>
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
            onClick={confirmar}
            style={boton(confirmando ? "disabled" : "success", { flex: 1, padding: 16, fontSize: 16 })}
          >
            {confirmando ? "Confirmando..." : "✓ Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={pageContainer({ maxWidth: 560 })}>
      <AppHeader titulo="🍹 Barra de retiro" subtitulo={usuario.nombre} onLogout={logout} />

      <div style={{ display: "flex", gap: 8 }}>
        <input
          placeholder="Código de 6 dígitos"
          value={codigoInput}
          onChange={(e) => setCodigoInput(e.target.value)}
          style={{
            flex: 1,
            padding: 14,
            fontSize: 16,
            background: colors.surface,
            border: `1px solid ${colors.surfaceBorder}`,
            borderRadius: radius.sm,
            color: colors.text,
          }}
        />
        <button onClick={buscarPorCodigo} style={boton("primary", { padding: "0 20px" })}>
          Buscar
        </button>
      </div>
      <button onClick={() => setMostrarCamara((v) => !v)} style={boton("secondary", { marginTop: 10, width: "100%" })}>
        {mostrarCamara ? "Cerrar cámara" : "📷 Escanear QR"}
      </button>
      {mostrarCamara && <EscanerQR onResultado={alEscanear} onCerrar={() => setMostrarCamara(false)} />}
      {errorAccion && (
        <p style={{ color: colors.danger, background: colors.dangerBg, padding: 12, borderRadius: radius.sm, marginTop: 12 }}>
          {errorAccion}
        </p>
      )}

      <h2 style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginTop: 28, marginBottom: 10 }}>
        Cola ({pedidos.length})
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
            <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ color: colors.textMuted }}>${p.montoTotal}</span>
              {p.estado === "demorado" && (
                <span
                  style={{
                    background: colors.warningBg,
                    color: colors.warning,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: "4px 10px",
                    borderRadius: radius.pill,
                  }}
                >
                  demorado
                </span>
              )}
            </span>
          </div>
        ))}
        {pedidos.length === 0 && <p style={{ color: colors.textFaint, fontSize: 14 }}>No hay pedidos esperando retiro.</p>}
      </div>
    </div>
  );
}
