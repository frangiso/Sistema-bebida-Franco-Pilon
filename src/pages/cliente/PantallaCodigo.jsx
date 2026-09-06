import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "../../firebase.js";
import { verificarPagoPedido } from "../../lib/callables.js";

const MENSAJES_ESTADO = {
  pendientePago: {
    efectivo: "Pagá en caja y mostrá este código para que te lo acrediten.",
    mercadoPago: "Confirmando tu pago con Mercado Pago...",
  },
  pendienteRetiro: "Pago confirmado. Andá a la barra de retiro y mostrá este código.",
  demorado: "Tu pedido sigue esperando en la barra de retiro, andá a buscarlo cuando puedas.",
  entregado: "¡Listo, ya retiraste tu pedido! Disfrutalo.",
};

// Fallback por si el webhook de Mercado Pago se pierde o llega tarde: mientras
// el pedido siga "pendientePago" y sea de MP, insistimos consultando el estado
// real del pago cada 2.5s (no dependemos solo del webhook).
const INTERVALO_POLLING_MS = 2500;
const INTENTOS_MAX_POLLING = 40; // ~100s

export default function PantallaCodigo({ pedidoId, alPedirOtro }) {
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "pedidos", pedidoId),
      (snap) => {
        if (!snap.exists()) {
          setError("No se encontró el pedido.");
          return;
        }
        setPedido(snap.data());
      },
      () => setError("No se pudo cargar el pedido (revisá tu conexión).")
    );
    return unsubscribe;
  }, [pedidoId]);

  useEffect(() => {
    if (!pedido || pedido.metodoPago !== "mercadoPago" || pedido.estado !== "pendientePago") {
      return;
    }
    let intentos = 0;
    const intervalo = setInterval(async () => {
      intentos += 1;
      try {
        await verificarPagoPedido({ pedidoId });
      } catch {
        // Si falla la consulta puntual, no pasa nada: el listener de arriba
        // igual va a reaccionar en cuanto el webhook (u otro polling) confirme.
      }
      if (intentos >= INTENTOS_MAX_POLLING) {
        clearInterval(intervalo);
      }
    }, INTERVALO_POLLING_MS);
    return () => clearInterval(intervalo);
  }, [pedido, pedidoId]);

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "#f66" }}>{error}</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div style={{ padding: 24 }}>
        <p style={{ color: "#aaa" }}>Cargando pedido...</p>
      </div>
    );
  }

  const mensaje =
    pedido.estado === "pendientePago" ? MENSAJES_ESTADO.pendientePago[pedido.metodoPago] : MENSAJES_ESTADO[pedido.estado];

  return (
    <div style={{ padding: 24, textAlign: "center" }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>Tu pedido</h1>
      <p style={{ color: "#aaa", fontSize: 14, marginBottom: 16 }}>{mensaje}</p>

      <div style={{ background: "#fff", display: "inline-block", padding: 16, borderRadius: 12 }}>
        <QRCodeSVG value={pedido.qrPayload} size={200} />
      </div>

      <p style={{ fontSize: 14, color: "#aaa", marginTop: 16 }}>Código de respaldo</p>
      <p style={{ fontSize: 40, fontWeight: 700, letterSpacing: 4 }}>{pedido.codigoNumerico}</p>

      <p style={{ fontSize: 16, marginTop: 16 }}>Total: ${pedido.montoTotal}</p>

      {pedido.estado === "entregado" && (
        <button
          onClick={alPedirOtro}
          style={{ marginTop: 24, padding: "12px 24px", fontSize: 16, background: "#2d7", border: "none", borderRadius: 8 }}
        >
          Pedir otra cosa
        </button>
      )}
    </div>
  );
}
