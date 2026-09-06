const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db } = require("./lib/admin");
const { hashearPin } = require("./lib/pin");

const REGION = "southamerica-east1";

/** Resetea el PIN de un bartender/cajero existente. Solo el admin. */
exports.cambiarPinStaff = onCall({ region: REGION }, async (request) => {
  const { auth, data } = request;
  if (!auth || auth.token.rol !== "admin") {
    throw new HttpsError("permission-denied", "Solo el admin puede cambiar PINs.");
  }

  const { usuarioId, pin } = data || {};
  if (!usuarioId || !pin) {
    throw new HttpsError("invalid-argument", "Faltan datos.");
  }
  if (!/^\d{4,6}$/.test(pin)) {
    throw new HttpsError("invalid-argument", "El PIN debe tener entre 4 y 6 dígitos.");
  }

  const pinHasheado = await hashearPin(pin);
  await db.collection("usuarios").doc(usuarioId).update({ pin: pinHasheado });

  return { ok: true };
});
