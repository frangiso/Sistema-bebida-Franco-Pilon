import { useEffect, useState } from "react";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase.js";
import { colors, boton, input, card } from "../../theme.js";

const CATEGORIAS = ["tragos", "cervezas", "sinAlcohol", "shots"];

const vacio = { nombre: "", categoria: CATEGORIAS[0], precio: "", stock: "-1", orden: "0" };

export default function PanelCatalogo() {
  const [productos, setProductos] = useState([]);
  const [nuevo, setNuevo] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "productos"), orderBy("orden", "asc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProductos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  async function agregarProducto(e) {
    e.preventDefault();
    if (!nuevo.nombre || !nuevo.precio) return;
    setGuardando(true);
    try {
      await addDoc(collection(db, "productos"), {
        nombre: nuevo.nombre,
        categoria: nuevo.categoria,
        precio: Number(nuevo.precio),
        foto: "",
        stock: Number(nuevo.stock),
        activo: true,
        orden: Number(nuevo.orden),
      });
      setNuevo(vacio);
    } finally {
      setGuardando(false);
    }
  }

  function actualizarCampo(productoId, campo, valor) {
    updateDoc(doc(db, "productos", productoId), { [campo]: valor });
  }

  function eliminarProducto(productoId) {
    if (confirm("¿Eliminar este producto del catálogo?")) {
      deleteDoc(doc(db, "productos", productoId));
    }
  }

  return (
    <div>
      <form onSubmit={agregarProducto} style={card({ padding: 18, marginBottom: 20 })}>
        <p style={{ fontSize: 12, color: colors.textMuted, fontWeight: 700, textTransform: "uppercase", marginBottom: 12 }}>
          Nuevo producto
        </p>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          <input
            placeholder="Nombre"
            value={nuevo.nombre}
            onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
            style={input({ flex: "1 1 160px", width: "auto" })}
          />
          <select
            value={nuevo.categoria}
            onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })}
            style={input({ flex: "1 1 130px", width: "auto" })}
          >
            {CATEGORIAS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <input
            placeholder="Precio"
            type="number"
            value={nuevo.precio}
            onChange={(e) => setNuevo({ ...nuevo, precio: e.target.value })}
            style={input({ flex: "1 1 100px", width: "auto" })}
          />
          <input
            placeholder="Stock (-1 = ilimitado)"
            type="number"
            value={nuevo.stock}
            onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })}
            style={input({ flex: "1 1 160px", width: "auto" })}
          />
          <input
            placeholder="Orden"
            type="number"
            value={nuevo.orden}
            onChange={(e) => setNuevo({ ...nuevo, orden: e.target.value })}
            style={input({ flex: "1 1 90px", width: "auto" })}
          />
          <button type="submit" disabled={guardando} style={boton(guardando ? "disabled" : "primary", { flex: "1 1 120px" })}>
            Agregar
          </button>
        </div>
      </form>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {productos.map((p) => (
          <div
            key={p.id}
            style={card({ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", flexWrap: "wrap", opacity: p.activo ? 1 : 0.5 })}
          >
            <span style={{ flex: "1 1 160px", fontWeight: 700 }}>
              {p.nombre} <span style={{ color: colors.textMuted, fontSize: 12, fontWeight: 400 }}>({p.categoria})</span>
            </span>
            <input
              type="number"
              defaultValue={p.precio}
              onBlur={(e) => actualizarCampo(p.id, "precio", Number(e.target.value))}
              style={input({ width: 90 })}
            />
            <input
              type="number"
              defaultValue={p.stock}
              onBlur={(e) => actualizarCampo(p.id, "stock", Number(e.target.value))}
              style={input({ width: 90 })}
            />
            <button
              onClick={() => actualizarCampo(p.id, "activo", !p.activo)}
              style={boton(p.activo ? "success" : "secondary", { padding: "8px 14px", fontSize: 13 })}
            >
              {p.activo ? "Activo" : "Inactivo"}
            </button>
            <button onClick={() => eliminarProducto(p.id)} style={boton("danger", { padding: "8px 14px", fontSize: 13 })}>
              Eliminar
            </button>
          </div>
        ))}
        {productos.length === 0 && <p style={{ color: colors.textFaint, fontSize: 14 }}>Todavía no cargaste productos.</p>}
      </div>
    </div>
  );
}
