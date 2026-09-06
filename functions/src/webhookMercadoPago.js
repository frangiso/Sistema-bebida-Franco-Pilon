const crypto = require("crypto");
const { onRequest } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { logger } = require("firebase-functions");
const { confirmarPagoPedido } = require("./lib/confirmarPago");

const REGION = "southamerica-east1";

// Secretos por Cloud Functions Secret Manager, NUNCA en Firestore ni en el
// frontend. Cada boliche configura los suyos con:
//   firebase functions:secrets:set MP_ACCESS_TOKEN
//   firebase functions:secrets:set MP_WEBHOOK_SECRET
const MP_ACCESS_TOKEN = defineSecret("MP_ACCESS_TOKEN");
const MP_WEBHOOK_SECRET = defineSecret("MP_WEBHOOK_SECRET");

/**
 * Valida la firma que manda Mercado Pago en el header x-signature, según
 * el esquema documentado por MP (HMAC-SHA256 sobre "id:{dataId};request-id:{xRequestId};ts:{ts};").
 * https://www.mercadopago.com.ar/developers/es/docs/your-integrations/notifications/webhooks
 */
function firmaEsValida({ xSignature, xRequestId, dataId, secret }) {
  if (!xSignature || !dataId) return false;

  const partes = Object.fromEntries(
    xSignature.split(",").map((par) => {
      const [clave, valor] = par.split("=");
      return [clave?.trim(), valor?.trim()];
    })
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${xRequestId ?? ""};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret).update(manifest).digest("hex");

  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(v1));
}

exports.webhookMercadoPago = onRequest(
  { region: REGION, secrets: [MP_ACCESS_TOKEN, MP_WEBHOOK_SECRET] },
  async (req, res) => {
    try {
      const dataId = req.query["data.id"] || req.body?.data?.id;
      const tipo = req.query.type || req.body?.type;

      const esValido = firmaEsValida({
        xSignature: req.get("x-signature"),
        xRequestId: req.get("x-request-id"),
        dataId,
        secret: MP_WEBHOOK_SECRET.value(),
      });

      if (!esValido) {
        logger.warn("webhookMercadoPago: firma inválida", { dataId });
        res.status(401).send("Firma inválida");
        return;
      }

      if (tipo !== "payment" || !dataId) {
        // Otras notificaciones (merchant_order, etc.) no nos interesan acá.
        res.status(200).send("ok");
        return;
      }

      const respuestaMp = await fetch(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${MP_ACCESS_TOKEN.value()}` },
      });

      if (!respuestaMp.ok) {
        logger.error("webhookMercadoPago: error consultando pago en MP", { dataId, status: respuestaMp.status });
        res.status(502).send("Error consultando MP");
        return;
      }

      const pago = await respuestaMp.json();
      const pedidoId = pago.external_reference;

      if (pago.status !== "approved") {
        // pending, rejected, etc.: no confirmamos nada, esperamos la próxima notificación.
        res.status(200).send("ok");
        return;
      }
      if (!pedidoId) {
        logger.error("webhookMercadoPago: pago aprobado sin external_reference", { dataId });
        res.status(200).send("ok");
        return;
      }

      await confirmarPagoPedido({
        pedidoId,
        metodoPagoEsperado: "mercadoPago",
        mpPaymentId: String(dataId),
      });

      res.status(200).send("ok");
    } catch (error) {
      logger.error("webhookMercadoPago: error inesperado", error);
      // 500 para que Mercado Pago reintente la notificación más tarde.
      res.status(500).send("Error interno");
    }
  }
);
