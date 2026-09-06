import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import { db } from "../../firebase.js";
import { verificarPagoPedido, iniciarPagoMercadoPago } from "../../lib/callables.js";
import { colors, radius, boton, card, pageContainer } from "../../theme.js";

const MENSAJES_ESTADO = {
  pendientePago: {
    efectivo: "Pagá en caja y mostrá este código para que te lo acrediten.",
    mercadoPago: "Escaneá el QR con tu celular (o tocá el botón) para pagar con Mercado Pago o tarjeta de débito/crédito.",
  },
  pendienteRetiro: "Pago confirmado. Andá a la barra de retiro y mostrá este código.",
  demorado: "Tu pedido sigue esperando en la barra de retiro, andá a buscarlo cuando puedas.",
  entregado: "¡Listo, ya retiraste tu pedido! Disfrutalo.",
};

const BADGE_ESTADO = {
  pendientePago: { label: "Esperando pago", color: colors.warning, bg: colors.warningBg },
  pendienteRetiro: { label: "Listo para retirar", color: colors.success, bg: colors.successBg },
  demorado: { label: "En espera", color: colors.warning, bg: colors.warningBg },
  entregado: { label: "Entregado", color: colors.info, bg: "rgba(62,198,255,0.14)" },
  cancelado: { label: "Cancelado", color: colors.danger, bg: colors.dangerBg },
};

// Fallback por si el webhook de Mercado Pago se pierde o llega tarde: mientras
// el pedido siga "pendientePago" y sea de MP, insistimos consultando el estado
// real del pago cada 2.5s (no dependemos solo del webhook).
const INTERVALO_POLLING_MS = 2500;
const INTENTOS_MAX_POLLING = 40; // ~100s

export default function PantallaCodigo({ pedidoId, alPedirOtro }) {
  const [pedido, setPedido] = useState(null);
  const [error, setError] = useState(null);
  const [linkPago, setLinkPago] = useState(null);
  const [generandoLink, setGenerandoLink] = useState(false);
  const [errorLink, setErrorLink] = useState(null);
  const [intentoLink, setIntentoLink] = useState(0);

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

  // Genera el link de Checkout Pro (incluye tarjeta de débito/crédito de
  // cualquier banco, no solo saldo de Mercado Pago) y lo mostramos como QR
  // para que el cliente pague desde su propio celular, sin depender de que
  // el dispositivo donde está esta pantalla sea el suyo (puede ser una
  // tablet compartida en el mostrador).
  useEffect(() => {
    if (!pedido || pedido.metodoPago !== "mercadoPago" || pedido.estado !== "pendientePago") {
      return;
    }
    if (linkPago || generandoLink) {
      return;
    }
    let cancelado = false;
    setGenerandoLink(true);
    setErrorLink(null);
    iniciarPagoMercadoPago({ pedidoId })
      .then(({ data }) => {
        if (!cancelado) setLinkPago(data.initPoint);
      })
      .catch((err) => {
        if (!cancelado) setErrorLink(err.message || "No se pudo generar el link de pago.");
      })
      .finally(() => {
        if (!cancelado) setGenerandoLink(false);
      });
    return () => {
      cancelado = true;
    };
  }, [pedido, pedidoId, linkPago, generandoLink, intentoLink]);

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
      <div style={pageContainer({ textAlign: "center" })}>
        <p style={{ color: colors.danger }}>{error}</p>
      </div>
    );
  }

  if (!pedido) {
    return (
      <div style={pageContainer({ textAlign: "center" })}>
        <p style={{ color: colors.textMuted }}>Cargando pedido...</p>
      </div>
    );
  }

  const mensaje =
    pedido.estado === "pendientePago" ? MENSAJES_ESTADO.pendientePago[pedido.metodoPago] : MENSAJES_ESTADO[pedido.estado];
  const badge = BADGE_ESTADO[pedido.estado];
  const esperandoPagoMP = pedido.estado === "pendientePago" && pedido.metodoPago === "mercadoPago";

  return (
    <div style={pageContainer({ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" })}>
      <h1 style={{ fontSize: 22, fontWeight: 800, marginBottom: 6 }}>Tu pedido</h1>

      {badge && (
        <span
          style={{
            display: "inline-block",
            background: badge.bg,
            color: badge.color,
            fontSize: 12,
            fontWeight: 700,
            padding: "6px 14px",
            borderRadius: radius.pill,
            marginBottom: 14,
          }}
        >
          {badge.label}
        </span>
      )}

      <p style={{ color: colors.textMuted, fontSize: 14, marginBottom: 20, maxWidth: 320 }}>{mensaje}</p>

      {esperandoPagoMP && (
        <div style={card({ padding: 24, width: "100%", maxWidth: 300, marginBottom: 16 })}>
          {linkPago && (
            <div style={{ background: "#fff", display: "inline-block", padding: 14, borderRadius: radius.md }}>
              <QRCodeSVG value={linkPago} size={190} />
            </div>
          )}
          {generandoLink && <p style={{ color: colors.textMuted, fontSize: 14 }}>Generando link de pago...</p>}
          {errorLink && (
            <div>
              <p style={{ color: colors.danger, fontSize: 13, marginBottom: 10 }}>{errorLink}</p>
              <button
                onClick={() => {
                  setErrorLink(null);
                  setIntentoLink((n) => n + 1);
                }}
                style={boton("secondary", { padding: "10px 16px", fontSize: 13 })}
              >
                Reintentar
              </button>
            </div>
          )}
          {linkPago && (
            <a
              href={linkPago}
              style={{ ...boton("primary", { width: "100%", padding: 14, fontSize: 15, marginTop: 16 }), display: "block", textDecoration: "none", boxSizing: "border-box" }}
            >
              💳 Pagar en este dispositivo
            </a>
          )}
          <p style={{ fontSize: 12, color: colors.textFaint, marginTop: 12 }}>
            Acepta tarjeta de débito/crédito de cualquier banco o billetera (Naranja X, Brubank, etc.) y saldo de Mercado Pago.
          </p>
          <div style={{ borderTop: `1px solid ${colors.surfaceBorder}`, marginTop: 16, paddingTop: 12 }}>
            <p style={{ fontSize: 18, fontWeight: 700 }}>Total: ${pedido.montoTotal}</p>
          </div>
        </div>
      )}

      <div style={card({ padding: 24, width: "100%", maxWidth: 300 })}>
        {esperandoPagoMP && (
          <p style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700, marginBottom: 12, textTransform: "uppercase" }}>
            Tu código de retiro
          </p>
        )}
        <div style={{ background: "#fff", display: "inline-block", padding: 14, borderRadius: radius.md }}>
          <QRCodeSVG value={pedido.qrPayload} size={esperandoPagoMP ? 120 : 190} />
        </div>

        <p style={{ fontSize: 13, color: colors.textMuted, marginTop: 18 }}>Código de respaldo</p>
        <p style={{ fontSize: 42, fontWeight: 800, letterSpacing: 6, margin: "4px 0 0", color: colors.accentAlt }}>
          {pedido.codigoNumerico}
        </p>

        {!esperandoPagoMP && (
          <div style={{ borderTop: `1px solid ${colors.surfaceBorder}`, marginTop: 18, paddingTop: 14 }}>
            <p style={{ fontSize: 18, fontWeight: 700 }}>Total: ${pedido.montoTotal}</p>
          </div>
        )}
      </div>

      {pedido.estado === "entregado" && (
        <button onClick={alPedirOtro} style={boton("primary", { marginTop: 28, padding: "14px 28px" })}>
          Pedir otra cosa
        </button>
      )}
    </div>
  );
}
