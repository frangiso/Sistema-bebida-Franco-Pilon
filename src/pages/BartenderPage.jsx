export default function BartenderPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Panel Bartender</h1>
      <p style={{ color: "#aaa", fontSize: 14 }}>Login usuario/PIN pendiente.</p>
      {/* TODO: login PIN, listener de pedidos "pendienteRetiro" FIFO,
          escaneo/tipeo de código, pantalla de confirmación con nombre+monto grande
          antes de tocar "Confirmar" (llama a confirmarEntrega). */}
    </div>
  );
}
