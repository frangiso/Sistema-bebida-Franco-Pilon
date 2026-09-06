import { useState } from "react";
import { collection, query, where, getDocs, documentId } from "firebase/firestore";
import { db } from "../../firebase.js";
import { colors, boton, input, card } from "../../theme.js";

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
      <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 20, flexWrap: "wrap" }}>
        <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} style={input({ width: "auto" })} />
        <span style={{ color: colors.textMuted }}>a</span>
        <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} style={input({ width: "auto" })} />
        <button onClick={buscar} style={boton(cargando ? "disabled" : "primary")}>
          {cargando ? "Buscando..." : "Buscar"}
        </button>
      </div>

      {dias.length > 0 && (
        <div style={card({ padding: 16, marginBottom: 16 })}>
          <p>
            Total período: <strong style={{ color: colors.accentAlt }}>${totalPeriodo}</strong> en {pedidosPeriodo} pedidos
          </p>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {dias.map((d) => (
          <div key={d.fecha} style={card({ display: "flex", justifyContent: "space-between", padding: "12px 16px" })}>
            <span>{d.fecha}</span>
            <span style={{ color: colors.textMuted }}>
              ${d.totalFacturado} — {d.cantidadPedidos} pedidos
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
