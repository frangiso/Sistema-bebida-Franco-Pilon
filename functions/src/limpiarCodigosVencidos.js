const { onSchedule } = require("firebase-functions/v2/scheduler");
const { logger } = require("firebase-functions");
const { db } = require("./lib/admin");

const REGION = "southamerica-east1";
const VIGENCIA_MINUTOS_DEFAULT = 120;

/**
 * Corre cada 1 hora: pedidos "pendienteRetiro" cuyo pago fue confirmado hace
 * más de `vigenciaCodigoMinutos` (config/general) pasan a "demorado". No se
 * borran ni se cancelan solos, es solo una señal visual para el bartender/dueño
 * de que ese cliente nunca vino a buscar el pedido.
 */
exports.limpiarCodigosVencidos = onSchedule({ region: REGION, schedule: "every 1 hours" }, async () => {
  const configSnap = await db.collection("config").doc("general").get();
  const vigenciaMinutos = configSnap.exists ? configSnap.data().vigenciaCodigoMinutos ?? VIGENCIA_MINUTOS_DEFAULT : VIGENCIA_MINUTOS_DEFAULT;

  const cutoff = new Date(Date.now() - vigenciaMinutos * 60 * 1000);

  const query = db
    .collection("pedidos")
    .where("estado", "==", "pendienteRetiro")
    .where("pagadoEn", "<", cutoff);

  const snap = await query.get();

  if (snap.empty) {
    logger.info("limpiarCodigosVencidos: nada para marcar como demorado");
    return;
  }

  const batch = db.batch();
  snap.docs.forEach((doc) => batch.update(doc.ref, { estado: "demorado" }));
  await batch.commit();

  logger.info(`limpiarCodigosVencidos: ${snap.size} pedido(s) marcados como demorado`);
});
