const { HttpsError } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./admin");

/**
 * Transacción atómica compartida por webhookMercadoPago y confirmarPagoEfectivo:
 * pasa el pedido de "pendientePago" a "pendienteRetiro" y descuenta stock DENTRO
 * de la misma transacción que confirma el pago (nunca antes), para que no pueda
 * haber sobreventa.
 *
 * Es idempotente: si el pedido ya fue confirmado (por un reintento del webhook
 * de MP, por ejemplo), no vuelve a descontar stock ni pisa datos.
 *
 * @param {object} params
 * @param {string} params.pedidoId
 * @param {"mercadoPago"|"efectivo"} params.metodoPagoEsperado
 * @param {string|null} params.mpPaymentId
 * @param {string|null} params.confirmadoPorUsuarioId - uid del cajero, si aplica
 */
async function confirmarPagoPedido({ pedidoId, metodoPagoEsperado, mpPaymentId = null, confirmadoPorUsuarioId = null }) {
  const pedidoRef = db.collection("pedidos").doc(pedidoId);

  return db.runTransaction(async (transaction) => {
    const pedidoSnap = await transaction.get(pedidoRef);
    if (!pedidoSnap.exists) {
      throw new HttpsError("not-found", "El pedido no existe.");
    }
    const pedido = pedidoSnap.data();

    if (pedido.metodoPago !== metodoPagoEsperado) {
      throw new HttpsError("failed-precondition", "El método de pago no coincide con el pedido.");
    }

    // Idempotencia: si ya se confirmó (reintento de webhook, doble tap del
    // cajero, etc.) no volvemos a tocar stock, devolvemos éxito igual.
    if (pedido.estado !== "pendientePago") {
      return { pedidoId, estado: pedido.estado, yaConfirmado: true };
    }

    const productoRefs = pedido.items.map((item) => db.collection("productos").doc(item.productoId));
    const productoSnaps = await Promise.all(productoRefs.map((ref) => transaction.get(ref)));

    productoSnaps.forEach((snap, idx) => {
      const item = pedido.items[idx];
      if (!snap.exists) {
        throw new HttpsError("not-found", `Producto ${item.productoId} no existe.`);
      }
      const producto = snap.data();
      if (producto.stock !== -1 && producto.stock < item.cantidad) {
        throw new HttpsError("failed-precondition", `Sin stock de ${item.nombre} al confirmar el pago.`);
      }
    });

    productoSnaps.forEach((snap, idx) => {
      const item = pedido.items[idx];
      const producto = snap.data();
      if (producto.stock !== -1) {
        transaction.update(snap.ref, { stock: producto.stock - item.cantidad });
      }
    });

    transaction.update(pedidoRef, {
      estado: "pendienteRetiro",
      pagadoEn: FieldValue.serverTimestamp(),
      mpPaymentId: mpPaymentId,
      confirmadoPorUsuarioId: confirmadoPorUsuarioId,
    });

    return { pedidoId, estado: "pendienteRetiro", yaConfirmado: false };
  });
}

module.exports = { confirmarPagoPedido };
