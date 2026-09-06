const ESTADOS_ACTIVOS = ["creado", "pendientePago", "pendienteRetiro", "demorado"];

function generarCandidatoCodigo() {
  // 6 dígitos, con cero a la izquierda si hace falta.
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

/**
 * Busca un codigoNumerico de 6 dígitos que no esté en uso por ningún pedido
 * activo (no entregado/cancelado). Se llama DENTRO de una transacción para
 * que la lectura de unicidad y la escritura del pedido sean atómicas.
 */
async function generarCodigoUnicoEnTransaccion(transaction, db) {
  const MAX_INTENTOS = 8;
  for (let intento = 0; intento < MAX_INTENTOS; intento++) {
    const candidato = generarCandidatoCodigo();
    const query = db
      .collection("pedidos")
      .where("codigoNumerico", "==", candidato)
      .where("estado", "in", ESTADOS_ACTIVOS)
      .limit(1);
    const snap = await transaction.get(query);
    if (snap.empty) {
      return candidato;
    }
  }
  throw new Error("No se pudo generar un código numérico único, reintentar.");
}

module.exports = { ESTADOS_ACTIVOS, generarCodigoUnicoEnTransaccion };
