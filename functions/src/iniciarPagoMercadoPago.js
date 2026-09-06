const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { db } = require("./lib/admin");

const REGION = "southamerica-east1";
const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");

/**
 * Genera la preferencia de Checkout Pro para un pedido ya creado (crearPedido)
 * con metodoPago "mercadoPago", y devuelve el init_point al que el frontend
 * redirige al cliente. external_reference = pedidoId, así el webhook y
 * verificarPagoPedido pueden encontrar el pedido a partir del pago de MP.
 */
exports.iniciarPagoMercadoPago = onCall({ region: REGION, secrets: [MP_ACCESS_TOKEN] }, async (request) => {
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
  if (pedido.metodoPago !== "mercadoPago") {
    throw new HttpsError("failed-precondition", "Este pedido no es de Mercado Pago.");
  }
  if (pedido.estado !== "pendientePago") {
    throw new HttpsError("failed-precondition", `El pedido está en estado "${pedido.estado}".`);
  }

  const configSnap = await db.collection("config").doc("general").get();
  const nombreLocal = configSnap.exists ? configSnap.data().nombreLocal : "Barra";
  const baseUrl = (configSnap.exists && configSnap.data().appBaseUrl) || null;

  const preferencia = {
    items: pedido.items.map((item) => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precioUnitario,
      currency_id: "ARS",
    })),
    external_reference: pedidoId,
    notification_url: `https://${REGION}-${process.env.GCLOUD_PROJECT}.cloudfunctions.net/webhookMercadoPago`,
    statement_descriptor: nombreLocal,
    ...(baseUrl && {
      back_urls: {
        success: `${baseUrl}/pedido/${pedidoId}`,
        pending: `${baseUrl}/pedido/${pedidoId}`,
        failure: `${baseUrl}/pedido/${pedidoId}`,
      },
      auto_return: "approved",
    }),
  };

  const respuesta = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(preferencia),
  });

  if (!respuesta.ok) {
    const detalle = await respuesta.text();
    throw new HttpsError("internal", `Error creando preferencia de pago en MP: ${detalle}`);
  }

  const { init_point: initPoint, id: preferenceId } = await respuesta.json();
  return { initPoint, preferenceId };
});
