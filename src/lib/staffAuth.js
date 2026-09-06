import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";

/**
 * Sesión de staff (bartender/cajero) con email+contraseña, igual que el
 * admin: el rol se valida leyendo el documento en usuarios/{uid}, no hace
 * falta ninguna Cloud Function para loguearse.
 */
async function usuarioConRol(uid, rolEsperado) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  if (data.rol !== rolEsperado || data.activo !== true) return null;
  return { uid, rol: data.rol, nombre: data.nombre };
}

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
      const encontrado = await usuarioConRol(firebaseUser.uid, rolEsperado);
      setUsuario(encontrado);
      setCargando(false);
    });
    return unsubscribe;
  }, [rolEsperado]);

  const login = useCallback(
    async (email, password) => {
      setError(null);
      try {
        const cred = await signInWithEmailAndPassword(auth, email, password);
        const encontrado = await usuarioConRol(cred.user.uid, rolEsperado);
        if (!encontrado) {
          setError("Esta cuenta no tiene permisos para este panel.");
          await signOut(auth);
          return;
        }
        setUsuario(encontrado);
      } catch (err) {
        setError(err.message || "Email o contraseña incorrectos.");
      }
    },
    [rolEsperado]
  );

  const logout = useCallback(() => signOut(auth), []);

  return { usuario, cargando, error, login, logout };
}
