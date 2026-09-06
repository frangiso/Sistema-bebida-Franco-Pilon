export default function AdminPage() {
  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Panel Dueño/Admin</h1>
      <p style={{ color: "#aaa", fontSize: 14 }}>Login email/password pendiente.</p>
      {/* TODO: login email/password, vivo (pedidos 24hs + ventasDiarias/hoy),
          histórico (query por rango sobre ventasDiarias), gestión de catálogo. */}
    </div>
  );
}
