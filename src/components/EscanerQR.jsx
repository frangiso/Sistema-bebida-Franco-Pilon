import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { boton, card } from "../theme.js";

const CONTENEDOR_ID = "lector-qr";

export default function EscanerQR({ onResultado, onCerrar }) {
  useEffect(() => {
    const scanner = new Html5QrcodeScanner(CONTENEDOR_ID, { fps: 10, qrbox: 220 }, false);
    scanner.render(
      (textoDecodificado) => {
        scanner.clear().catch(() => {});
        onResultado(textoDecodificado);
      },
      () => {
        // Callback de error de frame individual (típico mientras enfoca), se ignora.
      }
    );
    return () => {
      scanner.clear().catch(() => {});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={card({ marginTop: 12, padding: 12 })}>
      <div id={CONTENEDOR_ID} />
      <button onClick={onCerrar} style={boton("secondary", { marginTop: 8, width: "100%" })}>
        Cerrar cámara
      </button>
    </div>
  );
}
