const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, auth } = require("./lib/admin");
const { hashearPin } = require("./lib/pin");

const REGION = "southamerica-east1";
const ROLES_STAFF = ["bartender", "cajero"];

/**
 * Da de alta a un bartender/cajero: crea el usuario de Firebase Auth (sin
 * email/password, solo necesita un uid) y su doc en usuarios/{uid} con el
 * PIN hasheado. El id del doc usuarios/{uid} es, por convención, el mismo
 * uid de Auth (ver loginStaff.js / sincronizarRolStaff.js), así que crear
 * ese doc dispara automáticamente el custom claim "rol" vía el trigger.
 */
exports.crearUsuarioStaff = onCall({ region: REGION }, async (request) => {
  const { auth: authCtx, data } = request;
  if (!authCtx || authCtx.token.rol !== "admin") {
    throw new HttpsError("permission-denied", "Solo el admin puede crear usuarios de staff.");
  }

  const { nombre, usuario, pin, rol } = data || {};
  if (!nombre || !usuario || !pin || !ROLES_STAFF.includes(rol)) {
    throw new HttpsError("invalid-argument", "Faltan datos o el rol no es válido.");
  }
  if (!/^\d{4,6}$/.test(pin)) {
    throw new HttpsError("invalid-argument", "El PIN debe tener entre 4 y 6 dígitos.");
  }

  const existente = await db.collection("usuarios").where("usuario", "==", usuario).limit(1).get();
  if (!existente.empty) {
    throw new HttpsError("already-exists", "Ese nombre de usuario ya está en uso.");
  }

  const usuarioAuth = await auth.createUser({ displayName: nombre });
  const pinHasheado = await hashearPin(pin);

  await db.collection("usuarios").doc(usuarioAuth.uid).set({
    nombre,
    usuario,
    rol,
    activo: true,
    pin: pinHasheado,
  });

  return { uid: usuarioAuth.uid, nombre, usuario, rol };
});
