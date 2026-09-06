const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./lib/admin");

const REGION = "southamerica-east1";

/**
 * Llamada por el bartender al escanear/tipear el código. Usa runTransaction
 * para que dos escaneos simultáneos del mismo QR (o una captura de pantalla
 * reusada) no puedan confirmar la entrega dos veces: la segunda lectura
 * siempre falla porque el estado ya no es "pendienteRetiro".
 */
exports.confirmarEntrega = onCall({ region: REGION }, async (request) => {
  const { auth, data } = request;

  if (!auth || !["bartender", "admin"].includes(auth.token.rol)) {
    throw new HttpsError("permission-denied", "Solo bartenders pueden confirmar entregas.");
  }

  const { codigoNumerico } = data || {};
  if (!codigoNumerico || typeof codigoNumerico !== "string") {
    throw new HttpsError("invalid-argument", "Falta codigoNumerico.");
  }

  const resultado = await db.runTransaction(async (transaction) => {
    // Un mismo codigoNumerico puede haber sido reutilizado por pedidos viejos ya
    // entregados/cancelados (solo se garantiza único entre los "activos"), así que
    // filtramos por los únicos estados en que tiene sentido entregar.
    const query = db
      .collection("pedidos")
      .where("codigoNumerico", "==", codigoNumerico)
      .where("estado", "in", ["pendienteRetiro", "demorado"])
      .limit(1);
    const snap = await transaction.get(query);

    if (snap.empty) {
      throw new HttpsError("not-found", "Código no encontrado o ya entregado.");
    }

    const pedidoDoc = snap.docs[0];
    const pedido = pedidoDoc.data();

    transaction.update(pedidoDoc.ref, {
      estado: "entregado",
      entregadoEn: FieldValue.serverTimestamp(),
      confirmadoPorUsuarioId: auth.uid,
    });

    return {
      pedidoId: pedidoDoc.id,
      items: pedido.items,
      montoTotal: pedido.montoTotal,
    };
  });

  await actualizarVentasDiarias(resultado.pedidoId, resultado.items, resultado.montoTotal);

  return resultado;
});

/**
 * Actualiza el agregado ventasDiarias/{fechaISO} para tener histórico rápido
 * sin tener que recorrer todos los pedidos. Se hace fuera de la transacción
 * de confirmarEntrega para no acoplar la confirmación (crítica) a un doc que
 * puede tener contención si varios bartenders confirman al mismo tiempo.
 */
async function actualizarVentasDiarias(pedidoId, items, montoTotal) {
  const fechaISO = new Date().toISOString().slice(0, 10);
  const ventasRef = db.collection("ventasDiarias").doc(fechaISO);

  await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ventasRef);
    const actual = snap.exists ? snap.data() : { totalFacturado: 0, cantidadPedidos: 0, ventasPorProducto: {} };

    const ventasPorProducto = { ...actual.ventasPorProducto };
    for (const item of items) {
      ventasPorProducto[item.productoId] = (ventasPorProducto[item.productoId] || 0) + item.cantidad;
    }
    const productoMasVendido = Object.entries(ventasPorProducto).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

    transaction.set(ventasRef, {
      totalFacturado: actual.totalFacturado + montoTotal,
      cantidadPedidos: actual.cantidadPedidos + 1,
      productoMasVendido,
      ventasPorProducto,
    });
  });
}
