import { useState } from "react";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../../firebase.js";

const inputStyle = { padding: 10, fontSize: 15, background: "#222", border: "1px solid #444", borderRadius: 8, color: "#fff" };

function hoyISO() {
  return new Date().toISOString().slice(0, 10);
}
function haceUnaSemanaISO() {
  return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export default function PanelHistorico() {
  const [desde, setDesde] = useState(haceUnaSemanaISO());
  const [hasta, setHasta] = useState(hoyISO());
  const [dias, setDias] = useState([]);
  const [cargando, setCargando] = useState(false);

  async function buscar() {
    setCargando(true);
    try {
      // ventasDiarias/{fechaISO}: el ID del doc ya es la fecha, así que un
      // rango por documentId() evita tener que leer todos los pedidos.
      const q = query(collection(db, "ventasDiarias"), where(documentId(), ">=", desde), where(documentId(), "<=", hasta));
      const snap = await getDocs(q);
      const lista = snap.docs.map((d) => ({ fecha: d.id, ...d.data() })).sort((a, b) => (a.fecha < b.fecha ? 1 : -1));
      setDias(lista);
    } finally {
      setCargando(false);
    }
  }

  const totalPeriodo = dias.reduce((acc, d) => acc + (d.totalFacturado || 0), 0);
  const pedidosPeriodo = dias.reduce((acc, d) => acc + (d.cantidadPedidos || 0), 0);

  return (
    <div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 16 }}>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={inputStyle} />
        <span style={{ color: "#888" }}>a</span>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={inputStyle} />
        <button onClick={buscar} style={{ padding: "10px 16px", background: "#2d7", border: "none", borderRadius: 8, color: "#fff" }}>
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {dias.length > 0 && (
        <p style={{ marginBottom: 16 }}>
          Total período: <strong>${totalPeriodo}</strong> en {pedidosPeriodo} pedidos
        </p>
      )}

      {dias.map((d) => (
        <div key={d.fecha} style={{ display: "flex", justifyContent: "space-between", padding: 10, borderBottom: "1px solid #2a2a2a" }}>
          <span>{d.fecha}</span>
          <span>
            ${d.totalFacturado} — {d.cantidadPedidos} pedidos
          </span>
        </div>
      ))}
    </div>
  );
}
