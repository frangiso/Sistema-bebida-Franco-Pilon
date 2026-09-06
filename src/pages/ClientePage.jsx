import { useEffect, useState } from "react";
import { asegurarSesionCliente } from "../firebase.js";

export default function ClientePage() {
  const [uid, setUid] = useState(null);

  useEffect(() => {
    asegurarSesionCliente().then((usuario) => setUid(usuario.uid));
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 8 }}>Pedí tu trago</h1>
      <p style={{ color: "#aaa", fontSize: 14 }}>
        {uid ? "Sesión lista." : "Iniciando sesión..."}
      </p>
      {/* TODO: catálogo (productos activos), carrito, checkout (MP / efectivo),
          pantalla de código (QR + numérico) y polling de estado del pedido. */}
    </div>
  );
}
