import { useCallback, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase.js";

/**
 * A diferencia de bartender/cajero (que se loguean con PIN vía Cloud Function
 * y quedan con el rol en un custom claim), el admin se valida leyendo directo
 * su documento en usuarios/{uid}. Así no depende de que las Cloud Functions
 * estén desplegadas para poder entrar al panel.
 */
async function esAdminValido(uid) {
  const snap = await getDoc(doc(db, "usuarios", uid));
  return snap.exists() && snap.data().rol === "admin" && snap.data().activo === true;
}

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
      const esAdmin = await esAdminValido(firebaseUser.uid);
      if (!esAdmin) {
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
      const esAdmin = await esAdminValido(cred.user.uid);
      if (!esAdmin) {
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
