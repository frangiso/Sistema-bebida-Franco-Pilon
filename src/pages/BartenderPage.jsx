import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";
import { useStaffSesion } from "../lib/staffAuth.js";
import { confirmarEntrega } from "../lib/callables.js";
import LoginEmail from "../components/LoginEmail.jsx";
import EscanerQR from "../components/EscanerQR.jsx";

const inputStyle = { flex: 1, padding: 10, fontSize: 16, background: "#222", border: "1px solid #444", borderRadius: 8, color: "#fff" };
const botonSecundario = { background: "none", border: "1px solid #444", color: "#fff", padding: 8, borderRadius: 8 };

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

  if (cargando) return <div style={{ padding: 24, color: "#aaa" }}>Cargando...</div>;
  if (!usuario) return <LoginEmail titulo="Bartender" onLogin={login} error={error} />;

  if (seleccionado) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20 }}>Confirmar entrega</h1>
        <div style={{ background: "#1a1a1a", padding: 16, borderRadius: 12, marginTop: 16 }}>
          {seleccionado.items.length === 0 && <p style={{ color: "#888" }}>(detalle no disponible todavía)</p>}
          {seleccionado.items.map((item) => (
            <p key={item.productoId} style={{ fontSize: 20 }}>
              {item.cantidad}x {item.nombre}
            </p>
          ))}
          <p style={{ fontSize: 32, fontWeight: 700, marginTop: 12 }}>
            {seleccionado.montoTotal != null ? `$${seleccionado.montoTotal}` : ""}
          </p>
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
            onClick={confirmar}
            style={{ flex: 1, padding: 14, borderRadius: 8, background: confirmando ? "#333" : "#2d7", color: "#fff", border: "none" }}
          >
            {confirmando ? "Confirmando..." : "Confirmar"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: 20 }}>Barra de retiro</h1>
        <button onClick={logout} style={{ background: "none", border: "none", color: "#888" }}>
          Salir
        </button>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 8 }}>
        <input placeholder="Código de 6 dígitos" value={codigoInput} onChange={(e) => setCodigoInput(e.target.value)} style={inputStyle} />
        <button onClick={buscarPorCodigo} style={{ padding: "0 16px", borderRadius: 8, background: "#2d7", border: "none", color: "#fff" }}>
          Buscar
        </button>
      </div>
      <button onClick={() => setMostrarCamara((v) => !v)} style={{ ...botonSecundario, marginTop: 8 }}>
        {mostrarCamara ? "Cerrar cámara" : "Escanear QR"}
      </button>
      {mostrarCamara && <EscanerQR onResultado={alEscanear} onCerrar={() => setMostrarCamara(false)} />}
      {errorAccion && <p style={{ color: "#f66" }}>{errorAccion}</p>}

      <h2 style={{ fontSize: 14, color: "#888", marginTop: 24 }}>Cola ({pedidos.length})</h2>
      {pedidos.map((p) => (
        <div key={p.id} onClick={() => setSeleccionado(p)} style={{ padding: 12, borderBottom: "1px solid #2a2a2a", cursor: "pointer" }}>
          <strong>{p.codigoNumerico}</strong> — ${p.montoTotal} {p.estado === "demorado" && <span style={{ color: "#f90" }}>(demorado)</span>}
        </div>
      ))}
    </div>
  );
}
