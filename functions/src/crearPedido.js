const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { db, FieldValue } = require("./lib/admin");
const { generarCodigoUnicoEnTransaccion } = require("./lib/codigos");

const REGION = "southamerica-east1";
const METODOS_PAGO_VALIDOS = ["mercadoPago", "efectivo"];

/**
 * Crea un pedido de forma idempotente:
 * - Si ya existe un pedido con el mismo idempotencyKey (mismo cliente reintentando
 *   por doble clic / reintento de red), devuelve el pedido existente sin duplicar.
 * - Si no existe, valida stock y precios contra Firestore (nunca confía en lo que
 *   manda el cliente), calcula el monto total, genera un código numérico único
 *   y crea el pedido.
 *
 * El stock NO se descuenta acá: se descuenta recién cuando el pago se confirma
 * (webhookMercadoPago / confirmarPagoEfectivo), dentro de la misma transacción
 * que confirma el pago, para evitar sobreventa.
 */
exports.crearPedido = onCall({ region: REGION }, async (request) => {
  const { auth, data } = request;

  if (!auth) {
    throw new HttpsError("unauthenticated", "Se requiere sesión de cliente.");
  }

  const { items, metodoPago, idempotencyKey } = data || {};

  if (!idempotencyKey || typeof idempotencyKey !== "string") {
    throw new HttpsError("invalid-argument", "Falta idempotencyKey.");
  }
  if (!METODOS_PAGO_VALIDOS.includes(metodoPago)) {
    throw new HttpsError("invalid-argument", "metodoPago inválido.");
  }
  if (!Array.isArray(items) || items.length === 0) {
    throw new HttpsError("invalid-argument", "El pedido no tiene items.");
  }
  for (const item of items) {
    if (!item || typeof item.productoId !== "string" || !Number.isInteger(item.cantidad) || item.cantidad <= 0) {
      throw new HttpsError("invalid-argument", "Item de pedido inválido.");
    }
  }

  const clienteId = auth.uid;
  const idemRef = db.collection("idempotencia").doc(idempotencyKey);
  const pedidoRef = db.collection("pedidos").doc();

  const resultado = await db.runTransaction(async (transaction) => {
    const idemSnap = await transaction.get(idemRef);

    if (idemSnap.exists) {
      // Reintento (doble clic, red lenta, etc.): devolvemos el pedido ya creado
      // en vez de crear uno nuevo.
      const pedidoExistenteId = idemSnap.data().pedidoId;
      const pedidoExistenteSnap = await transaction.get(db.collection("pedidos").doc(pedidoExistenteId));
      return { pedidoId: pedidoExistenteId, pedido: pedidoExistenteSnap.data(), reutilizado: true };
    }

    // Leer productos involucrados y validar stock/activo. Se suman cantidades
    // por si el mismo producto aparece repetido en el array de items.
    const productoIds = [...new Set(items.map((i) => i.productoId))];
    const productoRefs = productoIds.map((id) => db.collection("productos").doc(id));
    const productoSnaps = await Promise.all(productoRefs.map((ref) => transaction.get(ref)));

    const productosPorId = {};
    productoSnaps.forEach((snap, idx) => {
      if (!snap.exists) {
        throw new HttpsError("not-found", `Producto ${productoIds[idx]} no existe.`);
      }
      productosPorId[productoIds[idx]] = snap.data();
    });

    const cantidadPorProducto = {};
    for (const item of items) {
      cantidadPorProducto[item.productoId] = (cantidadPorProducto[item.productoId] || 0) + item.cantidad;
    }

    let montoTotal = 0;
    const itemsPedido = [];
    for (const productoId of Object.keys(cantidadPorProducto)) {
      const producto = productosPorId[productoId];
      const cantidad = cantidadPorProducto[productoId];

      if (!producto.activo) {
        throw new HttpsError("failed-precondition", `${producto.nombre} no está disponible.`);
      }
      if (producto.stock !== -1 && producto.stock < cantidad) {
        throw new HttpsError("failed-precondition", `No hay stock suficiente de ${producto.nombre}.`);
      }

      montoTotal += producto.precio * cantidad;
      itemsPedido.push({
        productoId,
        nombre: producto.nombre,
        cantidad,
        precioUnitario: producto.precio,
      });
    }

    const codigoNumerico = await generarCodigoUnicoEnTransaccion(transaction, db);

    const pedido = {
      codigoNumerico,
      qrPayload: pedidoRef.id,
      items: itemsPedido,
      montoTotal,
      metodoPago,
      // El pedido nace "creado" y pasa a "pendientePago" en el mismo instante:
      // no hay una acción intermedia separada antes de que el cliente pague
      // (ni para MP -que ya se genera con el total calculado acá- ni para
      // efectivo -que tiene que aparecer ya en la caja-).
      estado: "pendientePago",
      clienteId,
      creadoEn: FieldValue.serverTimestamp(),
      pagadoEn: null,
      entregadoEn: null,
      confirmadoPorUsuarioId: null,
      idempotencyKey,
      mpPaymentId: null,
    };

    transaction.set(pedidoRef, pedido);
    transaction.set(idemRef, { pedidoId: pedidoRef.id, creadoEn: FieldValue.serverTimestamp() });

    return { pedidoId: pedidoRef.id, pedido, reutilizado: false };
  });

  return resultado;
});
