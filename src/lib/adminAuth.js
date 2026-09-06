import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../firebase.js";

/** Sesión del dueño/admin: login estándar de Firebase Auth (email/password). */
export function useAdminSesion() {
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
      if (tokenResult.claims.rol !== "admin") {
        setUsuario(null);
        setCargando(false);
        return;
      }
      setUsuario({ uid: firebaseUser.uid, email: firebaseUser.email });
      setCargando(false);
    });
    return unsubscribe;
  }, []);

  const login = useCallback(async (email, password) => {
    setError(null);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      // Forzamos refresh por si el claim "rol" recién se sincronizó ahora
      // (primer login de esta cuenta después de que el admin la dio de alta).
      const tokenResult = await cred.user.getIdTokenResult(true);
      if (tokenResult.claims.rol !== "admin") {
        setError("Esta cuenta no tiene permisos de administrador.");
        await signOut(auth);
        return;
      }
      setUsuario({ uid: cred.user.uid, email: cred.user.email });
    } catch (err) {
      setError(err.message || "Email o contraseña incorrectos.");
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  return { usuario, cargando, error, login, logout };
}
