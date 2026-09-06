const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { confirmarPagoPedido } = require("./lib/confirmarPago");

const REGION = "southamerica-east1";

/**
 * Llamada por el cajero (nunca por el bartender) para confirmar que cobró en
 * efectivo. Reutiliza la misma transacción atómica que usa el webhook de MP
 * para pasar a "pendienteRetiro" y descontar stock.
 */
exports.confirmarPagoEfectivo = onCall({ region: REGION }, async (request) => {
  const { auth, data } = request;

  if (!auth || !["cajero", "admin"].includes(auth.token.rol)) {
    throw new HttpsError("permission-denied", "Solo cajeros pueden confirmar pagos en efectivo.");
  }

  const { pedidoId } = data || {};
  if (!pedidoId || typeof pedidoId !== "string") {
    throw new HttpsError("invalid-argument", "Falta pedidoId.");
  }

  return confirmarPagoPedido({
    pedidoId,
    metodoPagoEsperado: "efectivo",
    confirmadoPorUsuarioId: auth.uid,
  });
});
