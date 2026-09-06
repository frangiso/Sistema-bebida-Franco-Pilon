const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, auth } = require("./lib/admin");

const REGION = "southamerica-east1";

/**
 * Da de baja a un bartender/cajero: borra el usuario de Firebase Auth (así
 * no puede volver a loguearse aunque alguien tenga el PIN) y su doc en
 * usuarios/{uid}. El admin no puede borrarse a sí mismo desde acá (se valida
 * también en el frontend, pero la Cloud Function es la barrera real).
 */
exports.eliminarUsuarioStaff = onCall({ region: REGION }, async (request) => {
  const { auth: authCtx, data } = request;
  if (!authCtx || authCtx.token.rol !== "admin") {
    throw new HttpsError("permission-denied", "Solo el admin puede eliminar usuarios.");
  }

  const { usuarioId } = data || {};
  if (!usuarioId) {
    throw new HttpsError("invalid-argument", "Falta usuarioId.");
  }
  if (usuarioId === authCtx.uid) {
    throw new HttpsError("failed-precondition", "No podés eliminar tu propia cuenta desde acá.");
  }

  await db.collection("usuarios").doc(usuarioId).delete();
  await auth.deleteUser(usuarioId).catch(() => {
    // Puede no existir el usuario de Auth (por ejemplo, si ya se había borrado antes).
  });

  return { ok: true };
});
