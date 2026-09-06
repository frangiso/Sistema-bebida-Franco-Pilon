export default function CajeroPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Panel Cajero</h1>
      <p style={{ color: "#aaa", fontSize: 14 }}>Login usuario/PIN pendiente.</p>
      {/* TODO: login PIN, listener de pedidos "pendientePago" con metodoPago
          "efectivo", confirmar cobro (llama a confirmarPagoEfectivo). */}
    </div>
  );
}
