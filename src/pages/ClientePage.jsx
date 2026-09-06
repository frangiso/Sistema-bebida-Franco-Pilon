import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { asegurarSesionCliente } from "../firebase.js";
import { crearPedido } from "../lib/callables.js";
import Catalogo from "./cliente/Catalogo.jsx";
import PantallaCodigo from "./cliente/PantallaCodigo.jsx";
import Bienvenida from "./cliente/Bienvenida.jsx";
import { colors, pageContainer } from "../theme.js";

const STORAGE_KEY = "pedidoActivo";

export default function ClientePage() {
  const { pedidoId: pedidoIdUrl } = useParams();
  const navigate = useNavigate();
  const [sesionLista, setSesionLista] = useState(false);
  const [pedidoId, setPedidoId] = useState(pedidoIdUrl || null);
  const [modo, setModo] = useState("inicio"); // "inicio" | "pedir"
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState(null);
  // Se genera una sola vez por intento de pedido: si crearPedido se llama de
  // nuevo (doble clic, reintento de red), el backend detecta la misma key y
  // devuelve el pedido ya creado en vez de duplicarlo.
  const idempotencyKeyRef = useRef(null);

  useEffect(() => {
    asegurarSesionCliente().then(() => setSesionLista(true));
  }, []);

  useEffect(() => {
    // Si no llegamos acá por el back_url de Mercado Pago, nos fijamos si
    // había un pedido guardado localmente (por ejemplo, se recargó la
    // página por wifi malo justo después de generar el código).
    if (!pedidoIdUrl) {
      const guardado = localStorage.getItem(STORAGE_KEY);
      if (guardado) setPedidoId(guardado);
    }
  }, [pedidoIdUrl]);

  async function confirmarPedido(items, metodoPago) {
    if (!idempotencyKeyRef.current) {
      idempotencyKeyRef.current = crypto.randomUUID();
    }
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const { data } = await crearPedido({ items, metodoPago, idempotencyKey: idempotencyKeyRef.current });
      localStorage.setItem(STORAGE_KEY, data.pedidoId);
      setPedidoId(data.pedidoId);
      // El link/QR de pago (Mercado Pago o tarjeta) se genera en PantallaCodigo,
      // así funciona igual si el cliente recarga la página o vuelve más tarde.
    } catch (err) {
      setErrorEnvio(err.message || "No se pudo generar el pedido, probá de nuevo.");
    } finally {
      setEnviando(false);
    }
  }

  function pedirOtro() {
    localStorage.removeItem(STORAGE_KEY);
    idempotencyKeyRef.current = null;
    setPedidoId(null);
    navigate("/");
  }

  if (!sesionLista) {
    return <div style={pageContainer({ color: colors.textMuted })}>Iniciando sesión...</div>;
  }

  if (pedidoId) {
    return <PantallaCodigo pedidoId={pedidoId} alPedirOtro={pedirOtro} />;
  }

  if (modo === "inicio") {
    return <Bienvenida onPedir={() => setModo("pedir")} />;
  }

  return (
    <div>
      <Catalogo onConfirmar={confirmarPedido} enviando={enviando} onVolver={() => setModo("inicio")} />
      {errorEnvio && <p style={{ color: colors.danger, padding: "0 20px" }}>{errorEnvio}</p>}
    </div>
  );
}
