import { useEffect, useState } from "react";
import { collection, doc, query, where, orderBy, onSnapshot, Timestamp } from "firebase/firestore";
import { db } from "../../firebase.js";
import { colors, radius, card } from "../../theme.js";

const ESTADO_COLOR = {
  pendientePago: colors.textMuted,
  pendienteRetiro: colors.success,
  demorado: colors.warning,
  entregado: colors.info,
  cancelado: colors.danger,
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
      <div style={{ display: "flex", gap: 12, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={card({ padding: 18, flex: "1 1 160px" })}>
          <p style={{ color: colors.textMuted, fontSize: 13 }}>Facturado hoy</p>
          <p style={{ fontSize: 30, fontWeight: 800, color: colors.accentAlt }}>${ventasHoy?.totalFacturado ?? "..."}</p>
        </div>
        <div style={card({ padding: 18, flex: "1 1 160px" })}>
          <p style={{ color: colors.textMuted, fontSize: 13 }}>Pedidos hoy</p>
          <p style={{ fontSize: 30, fontWeight: 800 }}>{ventasHoy?.cantidadPedidos ?? "..."}</p>
        </div>
      </div>

      <h2 style={{ fontSize: 12, color: colors.textMuted, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>
        Últimas 24hs ({pedidos.length})
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {pedidos.map((p) => (
          <div key={p.id} style={card({ display: "flex", justifyContent: "space-between", padding: "12px 16px", flexWrap: "wrap", gap: 8 })}>
            <span>
              <strong>{p.codigoNumerico}</strong>{" "}
              <span style={{ color: colors.textMuted }}>
                — ${p.montoTotal} ({p.metodoPago})
              </span>
            </span>
            <span
              style={{
                color: ESTADO_COLOR[p.estado] ?? colors.text,
                fontWeight: 700,
                fontSize: 13,
                background: "rgba(255,255,255,0.05)",
                padding: "3px 10px",
                borderRadius: radius.pill,
              }}
            >
              {p.estado}
            </span>
          </div>
        ))}
        {pedidos.length === 0 && <p style={{ color: colors.textFaint, fontSize: 14 }}>Sin pedidos en las últimas 24hs.</p>}
      </div>
    </div>
  );
}
