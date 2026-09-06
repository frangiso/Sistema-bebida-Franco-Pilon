// Paleta y helpers de estilo compartidos, pensados para que la app se sienta
// "de boliche": fondo oscuro con degradé violeta/magenta, tarjetas tipo glass
// y botones con glow. Se sigue usando estilos inline (sin CSS-in-JS ni
// frameworks), solo que los tokens viven acá para no repetir valores sueltos
// en cada pantalla.

export const colors = {
  bg: "#0b0614",
  bgGradient: "radial-gradient(circle at 18% -10%, #3d1768 0%, #180a2e 42%, #060309 100%)",
  surface: "rgba(255,255,255,0.055)",
  surfaceBorder: "rgba(255,255,255,0.1)",
  surfaceStrong: "rgba(255,255,255,0.09)",
  text: "#f6f4fb",
  textMuted: "#a79fc4",
  textFaint: "#736a91",
  accent: "#ff3d81",
  accentAlt: "#9b5cff",
  gradient: "linear-gradient(135deg, #9b5cff 0%, #ff3d81 100%)",
  success: "#1fe3a6",
  successBg: "rgba(31,227,166,0.14)",
  danger: "#ff5470",
  dangerBg: "rgba(255,84,112,0.14)",
  warning: "#ffb648",
  warningBg: "rgba(255,182,72,0.14)",
  info: "#3ec6ff",
};

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 };

export const shadow = {
  glow: "0 8px 26px rgba(155,92,255,0.35)",
  card: "0 6px 20px rgba(0,0,0,0.35)",
};

export const font = { family: "'Manrope', system-ui, -apple-system, sans-serif" };

export function card(extra = {}) {
  return {
    background: colors.surface,
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: radius.md,
    boxShadow: shadow.card,
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    ...extra,
  };
}

const botonVariantes = {
  primary: { background: colors.gradient, color: "#fff", boxShadow: shadow.glow },
  secondary: { background: colors.surfaceStrong, color: colors.text, border: `1px solid ${colors.surfaceBorder}` },
  success: { background: colors.success, color: "#04241a" },
  danger: { background: colors.danger, color: "#2b0410" },
  ghost: { background: "transparent", color: colors.textMuted, border: `1px solid ${colors.surfaceBorder}` },
  disabled: { background: colors.surfaceStrong, color: colors.textFaint },
};

export function boton(variante = "primary", extra = {}) {
  return {
    border: "none",
    borderRadius: radius.sm,
    fontWeight: 700,
    fontSize: 15,
    cursor: "pointer",
    padding: "14px 20px",
    fontFamily: font.family,
    ...botonVariantes[variante],
    ...extra,
  };
}

export function input(extra = {}) {
  return {
    display: "block",
    width: "100%",
    boxSizing: "border-box",
    padding: "13px 14px",
    fontSize: 15,
    background: "rgba(255,255,255,0.06)",
    border: `1px solid ${colors.surfaceBorder}`,
    borderRadius: radius.sm,
    color: colors.text,
    outline: "none",
    fontFamily: font.family,
    ...extra,
  };
}

export function pageContainer(extra = {}) {
  return {
    minHeight: "100dvh",
    maxWidth: 480,
    margin: "0 auto",
    padding: "28px 20px 40px",
    boxSizing: "border-box",
    ...extra,
  };
}
