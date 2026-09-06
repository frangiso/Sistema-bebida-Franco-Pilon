import { useEffect, useState } from "react";
import { collection, doc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.js";

const ESTADO_COLOR = {
  pendientePago: "#888",
  pendienteRetiro: "#2d7",
  demorado: "#f90",
  entregado: "#4af",
  cancelado: "#f66",
};

export default function PanelVivo() {
  const [pedidos, setPedidos] = useState([]);
  const [ventasHoy, setVentasHoy] = useState(null);

  useEffect(() => {
    const hace24h = Timestamp.fromDate(new Date(Date.now() - 24 * 60 * 60 * 1000));
    const q = query(collection(db, "pedidos"), where("creadoEn", ">=", hace24h), orderBy("creadoEn", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setPedidos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    const fechaISO = new Date().toISOString().slice(0, 10);
    const unsubscribe = onSnapshot(doc(db, "ventasDiarias", fechaISO), (snap) => {
      setVentasHoy(snap.exists() ? snap.data() : { totalFacturado: 0, cantidadPedidos: 0 });
    });
    return unsubscribe;
  }, []);

  return (
    <div>
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <div style={{ background: "#1a1a1a", padding: 16, borderRadius: 12, flex: 1 }}>
          <p style={{ color: "#888", fontSize: 13 }}>Facturado hoy</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>${ventasHoy?.totalFacturado ?? "..."}</p>
        </div>
        <div style={{ background: "#1a1a1a", padding: 16, borderRadius: 12, flex: 1 }}>
          <p style={{ color: "#888", fontSize: 13 }}>Pedidos hoy</p>
          <p style={{ fontSize: 28, fontWeight: 700 }}>{ventasHoy?.cantidadPedidos ?? "..."}</p>
        </div>
      </div>

      <h2 style={{ fontSize: 14, color: "#888" }}>Últimas 24hs ({pedidos.length})</h2>
      {pedidos.map((p) => (
        <div key={p.id} style={{ display: "flex", justifyContent: "space-between", padding: 10, borderBottom: "1px solid #2a2a2a" }}>
          <span>
            <strong>{p.codigoNumerico}</strong> — ${p.montoTotal} ({p.metodoPago})
          </span>
          <span style={{ color: ESTADO_COLOR[p.estado] ?? "#fff" }}>{p.estado}</span>
        </div>
      ))}
    </div>
  );
}
