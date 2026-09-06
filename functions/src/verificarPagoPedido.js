const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { db } = require("./lib/admin");
const { confirmarPagoPedido } = require("./lib/confirmarPago");

const REGION = "southamerica-east1";
const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");

/**
 * Fallback para cuando el webhook de Mercado Pago se pierde o llega tarde:
 * el frontend llama a esto cada 2-3s al volver del checkout mientras el
 * pedido siga "pendientePago". Busca el pago en la API de MP por
 * external_reference (no dependemos de tener guardado un mpPaymentId, porque
 * si el webhook nunca llegó tampoco lo tenemos) y si está aprobado, confirma
 * el pago con la misma transacción atómica que usa el webhook.
 */
exports.verificarPagoPedido = onCall({ region: REGION, secrets: [MP_ACCESS_TOKEN] }, async (request) => {
  const { auth, data } = request;
  if (!auth) {
    throw new HttpsError("unauthenticated", "Se requiere sesión de cliente.");
  }

  const { pedidoId } = data || {};
  if (!pedidoId || typeof pedidoId !== "string") {
    throw new HttpsError("invalid-argument", "Falta pedidoId.");
  }

  const pedidoSnap = await db.collection("pedidos").doc(pedidoId).get();
  if (!pedidoSnap.exists) {
    throw new HttpsError("not-found", "Pedido no encontrado.");
  }
  const pedido = pedidoSnap.data();

  if (pedido.clienteId !== auth.uid) {
    throw new HttpsError("permission-denied", "Este pedido no te pertenece.");
  }

  if (pedido.estado !== "pendientePago") {
    // Ya lo agarró el webhook (o ya se entregó, etc.): no hace falta pegarle a MP.
    return { estado: pedido.estado };
  }

  const url = `https://api.mercadopago.com/v1/payments/search?external_reference=${encodeURIComponent(pedidoId)}&sort=date_created&criteria=desc`;
  const respuesta = await fetch(url, {
    headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}` },
  });

  if (!respuesta.ok) {
    throw new HttpsError("internal", "No se pudo consultar el estado del pago en MP.");
  }

  const { results } = await respuesta.json();
  const pagoAprobado = results?.find((pago) => pago.status === "approved");

  if (!pagoAprobado) {
    return { estado: "pendientePago" };
  }

  const resultado = await confirmarPagoPedido({
    pedidoId,
    metodoPagoEsperado: "mercadoPago",
    mpPaymentId: String(pagoAprobado.id),
  });

  return { estado: resultado.estado };
});
