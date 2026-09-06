const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions");
const { auth } = require("./lib/admin");

const REGION = "southamerica-east1";

/**
 * Mantiene el custom claim "rol" en Firebase Auth sincronizado con
 * usuarios/{usuarioId}. Necesario para el admin (login email/password
 * estándar, no pasa por loginStaff) y como red de seguridad si a un
 * bartender/cajero le cambian el rol o lo desactivan sin que vuelva a
 * loguearse.
 *
 * Convención: el ID del doc en usuarios/{usuarioId} es el mismo uid de
 * Firebase Auth de esa persona (se crea con admin.auth().createUser()
 * desde el panel de admin).
 */
exports.sincronizarRolStaff = onDocumentWritten({ region: REGION, document: "usuarios/{usuarioId}" }, async (event) => {
  const usuarioId = event.params.usuarioId;
  const despues = event.data?.after?.data();

  if (!despues) {
    // El doc se borró: no le quitamos el claim automáticamente para no
    // dejar a nadie sin acceso por error; lo maneja el admin a mano.
    return;
  }

  try {
    await auth.setCustomUserClaims(usuarioId, despues.activo ? { rol: despues.rol } : { rol: null });
  } catch (error) {
    // Puede pasar si todavía no existe el usuario de Auth con ese uid
    // (por ejemplo, un admin que aún no inició sesión la primera vez).
    logger.warn(`sincronizarRolStaff: no se pudo setear claims para ${usuarioId}`, error);
  }
});
