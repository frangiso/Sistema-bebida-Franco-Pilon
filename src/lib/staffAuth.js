import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithCustomToken, signOut } from "firebase/auth";
import { auth } from "../firebase.js";
import { loginStaff } from "./callables.js";

/**
 * Sesión de staff (bartender/cajero) vía usuario+PIN. loginStaff ya deja el
 * rol embebido como claim en el custom token, así que apenas hacemos
 * signInWithCustomToken el ID token ya trae request.auth.token.rol listo
 * para que lo vean las Firestore Rules y las otras Cloud Functions.
 */
export function useStaffSesion(rolEsperado) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUsuario(null);
        setCargando(false);
        return;
      }
      const tokenResult = await firebaseUser.getIdTokenResult();
      if (tokenResult.claims.rol !== rolEsperado) {
        setUsuario(null);
        setCargando(false);
        return;
      }
      setUsuario({ uid: firebaseUser.uid, rol: tokenResult.claims.rol });
      setCargando(false);
    });
    return unsubscribe;
  }, [rolEsperado]);

  const login = useCallback(
    async (usuarioInput, pin) => {
      setError(null);
      try {
        const { data } = await loginStaff({ usuario: usuarioInput, pin });
        if (data.rol !== rolEsperado) {
          setError("Ese usuario no tiene permisos para este panel.");
          return;
        }
        await signInWithCustomToken(auth, data.token);
        setUsuario({ uid: auth.currentUser.uid, rol: data.rol, nombre: data.nombre });
      } catch (err) {
        setError(err.message || "Usuario o PIN incorrecto.");
      }
    },
    [rolEsperado]
  );

  const logout = useCallback(() => signOut(auth), []);

  return { usuario, cargando, error, login, logout };
}
