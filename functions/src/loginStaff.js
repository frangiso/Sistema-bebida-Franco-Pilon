const { onCall, HttpsError } = require("firebase-functions/v2/https");
const bcrypt = require("bcryptjs");
const { db, auth } = require("./lib/admin");

const REGION = "southamerica-east1";

/**
 * Login liviano para bartender/cajero: usuario + PIN (no email/password).
 * El uid de Firebase Auth de cada miembro del staff es, por convención, el
 * mismo ID que su documento en usuarios/{uid} (lo crea el admin desde el
 * panel con admin.auth().createUser() + un doc en usuarios con el mismo id).
 *
 * Devuelve un custom token con el rol embebido como claim, para que
 * confirmarEntrega/confirmarPagoEfectivo y las Firestore Rules puedan
 * confiar en request.auth.token.rol sin otra ida y vuelta.
 */
exports.loginStaff = onCall({ region: REGION }, async (request) => {
  const { usuario, pin } = request.data || {};

  if (!usuario || !pin) {
    throw new HttpsError("invalid-argument", "Falta usuario o pin.");
  }

  const snap = await db.collection("usuarios").where("usuario", "==", usuario).where("activo", "==", true).limit(1).get();

  if (snap.empty) {
    throw new HttpsError("unauthenticated", "Usuario o PIN incorrecto.");
  }

  const usuarioDoc = snap.docs[0];
  const datos = usuarioDoc.data();

  const pinValido = await bcrypt.compare(pin, datos.pin);
  if (!pinValido) {
    throw new HttpsError("unauthenticated", "Usuario o PIN incorrecto.");
  }

  await auth.setCustomUserClaims(usuarioDoc.id, { rol: datos.rol });
  const token = await auth.createCustomToken(usuarioDoc.id, { rol: datos.rol });

  return { token, rol: datos.rol, nombre: datos.nombre };
});
