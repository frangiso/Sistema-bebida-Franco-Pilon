import { useEffect, useState } from "react";
import { collection, addDoc, doc, updateDoc, deleteDoc, onSnapshot, orderBy, query } from "firebase/firestore";
import { db } from "../../firebase.js";

const CATEGORIAS = ["tragos", "cervezas", "sinAlcohol", "shots"];

const inputStyle = { padding: 8, fontSize: 14, background: "#222", border: "1px solid #444", borderRadius: 6, color: "#fff" };

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
      <form onSubmit={agregarProducto} style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
        <input
          placeholder="Nombre"
          value={nuevo.nombre}
          onChange={(e) => setNuevo({ ...nuevo, nombre: e.target.value })}
          style={inputStyle}
        />
        <select value={nuevo.categoria} onChange={(e) => setNuevo({ ...nuevo, categoria: e.target.value })} style={inputStyle}>
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
          style={{ ...inputStyle, width: 90 }}
        />
        <input
          placeholder="Stock (-1 = ilimitado)"
          type="number"
          value={nuevo.stock}
          onChange={(e) => setNuevo({ ...nuevo, stock: e.target.value })}
          style={{ ...inputStyle, width: 150 }}
        />
        <input
          placeholder="Orden"
          type="number"
          value={nuevo.orden}
          onChange={(e) => setNuevo({ ...nuevo, orden: e.target.value })}
          style={{ ...inputStyle, width: 70 }}
        />
        <button type="submit" disabled={guardando} style={{ padding: "8px 16px", background: "#2d7", border: "none", borderRadius: 6, color: "#fff" }}>
          Agregar
        </button>
      </form>

      {productos.map((p) => (
        <div key={p.id} style={{ display: "flex", alignItems: "center", gap: 8, padding: 8, borderBottom: "1px solid #2a2a2a" }}>
          <span style={{ flex: 1, opacity: p.activo ? 1 : 0.4 }}>
            {p.nombre} <span style={{ color: "#888", fontSize: 12 }}>({p.categoria})</span>
          </span>
          <input
            type="number"
            defaultValue={p.precio}
            onBlur={(e) => actualizarCampo(p.id, "precio", Number(e.target.value))}
            style={{ ...inputStyle, width: 80 }}
          />
          <input
            type="number"
            defaultValue={p.stock}
            onBlur={(e) => actualizarCampo(p.id, "stock", Number(e.target.value))}
            style={{ ...inputStyle, width: 80 }}
          />
          <button
            onClick={() => actualizarCampo(p.id, "activo", !p.activo)}
            style={{ padding: "6px 10px", background: p.activo ? "#2d7" : "#555", border: "none", borderRadius: 6, color: "#fff" }}
          >
            {p.activo ? "Activo" : "Inactivo"}
          </button>
          <button onClick={() => eliminarProducto(p.id)} style={{ padding: "6px 10px", background: "#a33", border: "none", borderRadius: 6, color: "#fff" }}>
            Eliminar
          </button>
        </div>
      ))}
    </div>
  );
}
