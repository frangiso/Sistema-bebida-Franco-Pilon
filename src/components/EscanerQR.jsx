import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

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
    <div style={{ marginTop: 12 }}>
      <div id={CONTENEDOR_ID} />
      <button
        onClick={onCerrar}
        style={{ marginTop: 8, background: "none", border: "1px solid #444", color: "#fff", padding: 8, borderRadius: 8 }}
      >
        Cerrar cámara
      </button>
    </div>
  );
}
