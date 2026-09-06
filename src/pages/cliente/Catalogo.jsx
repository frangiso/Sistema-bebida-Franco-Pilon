import { useState } from "react";
import { useCatalogo } from "../../lib/catalogo.js";
import { colors, radius, shadow, boton, card, pageContainer } from "../../theme.js";

const NOMBRE_CATEGORIA = {
  tragos: "Tragos",
  cervezas: "Cervezas",
  sinAlcohol: "Sin alcohol",
  shots: "Shots",
};

function botonCantidad(extra = {}) {
  return {
    width: 32,
    height: 32,
    borderRadius: "50%",
    border: "none",
    background: colors.surfaceStrong,
    color: colors.text,
    fontSize: 18,
    fontWeight: 700,
    lineHeight: "32px",
    padding: 0,
    ...extra,
  };
}

function chipMetodo(activo) {
  return {
    flex: 1,
    padding: 12,
    borderRadius: radius.sm,
    border: activo ? `2px solid ${colors.accentAlt}` : `1px solid ${colors.surfaceBorder}`,
    background: activo ? "rgba(155,92,255,0.18)" : colors.surface,
    color: colors.text,
    fontWeight: 600,
    fontSize: 14,
  };
}

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
    <div style={pageContainer({ paddingBottom: items.length > 0 ? 210 : 40 })}>
      <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: -0.4 }}>🍸 Pedí tu trago</h1>
      <p style={{ color: colors.textMuted, fontSize: 14, marginTop: 4, marginBottom: 24 }}>
        Elegí, confirmá y retirá sin hacer fila.
      </p>

      {productos.length === 0 && (
        <p style={{ color: colors.textMuted, ...card({ padding: 16, textAlign: "center" }) }}>Cargando catálogo...</p>
      )}

      {categorias.map((categoria) => (
        <div key={categoria} style={{ marginBottom: 24 }}>
          <h2
            style={{
              fontSize: 12,
              color: colors.accentAlt,
              textTransform: "uppercase",
              letterSpacing: 1,
              fontWeight: 800,
              marginBottom: 10,
            }}
          >
            {NOMBRE_CATEGORIA[categoria] || categoria}
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {productos
              .filter((p) => p.categoria === categoria)
              .map((producto) => (
                <div
                  key={producto.id}
                  style={card({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "14px 16px",
                  })}
                >
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 600 }}>{producto.nombre}</div>
                    <div style={{ color: colors.textMuted, fontSize: 14, marginTop: 2 }}>${producto.precio}</div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <button style={botonCantidad()} onClick={() => cambiarCantidad(producto.id, -1)}>
                      −
                    </button>
                    <span style={{ minWidth: 18, textAlign: "center", fontWeight: 700 }}>
                      {cantidades[producto.id] || 0}
                    </span>
                    <button style={botonCantidad({ background: colors.gradient })} onClick={() => cambiarCantidad(producto.id, 1)}>
                      +
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ))}

      {items.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(10,5,18,0.92)",
            backdropFilter: "blur(16px)",
            borderTop: `1px solid ${colors.surfaceBorder}`,
            padding: "16px 20px calc(16px + env(safe-area-inset-bottom))",
          }}
        >
          <div style={{ maxWidth: 480, margin: "0 auto" }}>
            <p style={{ fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
              Total: <span style={{ color: colors.accentAlt }}>${total}</span>
            </p>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              <button style={chipMetodo(metodoPago === "efectivo")} onClick={() => setMetodoPago("efectivo")}>
                💵 Efectivo
              </button>
              <button style={chipMetodo(metodoPago === "mercadoPago")} onClick={() => setMetodoPago("mercadoPago")}>
                💳 Mercado Pago
              </button>
            </div>
            <button
              disabled={enviando}
              onClick={() => onConfirmar(items, metodoPago)}
              style={boton(enviando ? "disabled" : "primary", { width: "100%", padding: 16, fontSize: 16 })}
            >
              {enviando ? "Enviando..." : "Confirmar pedido"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
