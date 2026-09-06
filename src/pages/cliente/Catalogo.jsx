import { useState } from "react";
import { useCatalogo } from "../../lib/catalogo.js";

const botonCantidad = {
  width: 28,
  height: 28,
  borderRadius: "50%",
  border: "1px solid #444",
  background: "#222",
  color: "#fff",
  fontSize: 16,
};

const botonMetodo = (activo) => ({
  flex: 1,
  padding: 10,
  borderRadius: 8,
  border: activo ? "2px solid #2d7" : "1px solid #444",
  background: activo ? "#173" : "#222",
  color: "#fff",
});

export default function Catalogo({ onConfirmar, enviando }) {
  const productos = useCatalogo();
  const [cantidades, setCantidades] = useState({});
  const [metodoPago, setMetodoPago] = useState("efectivo");

  function cambiarCantidad(productoId, delta) {
    setCantidades((prev) => {
      const actual = prev[productoId] || 0;
      const nueva = Math.max(0, actual + delta);
      return { ...prev, [productoId]: nueva };
    });
  }

  const items = Object.entries(cantidades)
    .filter(([, cantidad]) => cantidad > 0)
    .map(([productoId, cantidad]) => ({ productoId, cantidad }));

  const total = items.reduce((acc, item) => {
    const producto = productos.find((p) => p.id === item.productoId);
    return acc + (producto ? producto.precio * item.cantidad : 0);
  }, 0);

  const categorias = [...new Set(productos.map((p) => p.categoria))];

  return (
    <div style={{ padding: 24, paddingBottom: items.length > 0 ? 180 : 24 }}>
      <h1 style={{ fontSize: 22, marginBottom: 16 }}>Pedí tu trago</h1>

      {productos.length === 0 && <p style={{ color: "#aaa" }}>Cargando catálogo...</p>}

      {categorias.map((categoria) => (
        <div key={categoria}>
          <h2 style={{ fontSize: 14, color: "#888", textTransform: "uppercase", marginTop: 20, marginBottom: 8 }}>
            {categoria}
          </h2>
          {productos
            .filter((p) => p.categoria === categoria)
            .map((producto) => (
              <div
                key={producto.id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid #2a2a2a",
                }}
              >
                <div>
                  <div style={{ fontSize: 16 }}>{producto.nombre}</div>
                  <div style={{ color: "#888", fontSize: 13 }}>${producto.precio}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <button style={botonCantidad} onClick={() => cambiarCantidad(producto.id, -1)}>
                    -
                  </button>
                  <span style={{ minWidth: 16, textAlign: "center" }}>{cantidades[producto.id] || 0}</span>
                  <button style={botonCantidad} onClick={() => cambiarCantidad(producto.id, 1)}>
                    +
                  </button>
                </div>
              </div>
            ))}
        </div>
      ))}

      {items.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#111",
            borderTop: "1px solid #333",
            padding: 16,
          }}
        >
          <p style={{ fontSize: 18, marginBottom: 8 }}>Total: ${total}</p>
          <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <button style={botonMetodo(metodoPago === "efectivo")} onClick={() => setMetodoPago("efectivo")}>
              Efectivo
            </button>
            <button style={botonMetodo(metodoPago === "mercadoPago")} onClick={() => setMetodoPago("mercadoPago")}>
              Mercado Pago
            </button>
          </div>
          <button
            disabled={enviando}
            onClick={() => onConfirmar(items, metodoPago)}
            style={{
              width: "100%",
              padding: 14,
              fontSize: 16,
              background: enviando ? "#333" : "#2d7",
              color: "#fff",
              border: "none",
              borderRadius: 8,
            }}
          >
            {enviando ? "Enviando..." : "Confirmar pedido"}
          </button>
        </div>
      )}
    </div>
  );
}
