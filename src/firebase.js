import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const functions = getFunctions(app, "southamerica-east1");

// App secundaria, solo para que el admin pueda crear cuentas de Auth para
// bartender/cajero (createUserWithEmailAndPassword) sin que eso pise su
// propia sesión logueada (por eso no comparte la instancia de `auth`).
const appSecundaria = initializeApp(firebaseConfig, "secundaria");
export const authSecundario = getAuth(appSecundaria);

// Login liviano para clientes: no piden usuario/contraseña, solo necesitan
// un uid estable para que las reglas de Firestore les dejen leer su propio pedido.
export function asegurarSesionCliente() {
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (usuario) => {
        unsubscribe();
        if (usuario) {
          resolve(usuario);
        } else {
          signInAnonymously(auth).then((cred) => resolve(cred.user)).catch(reject);
        }
      },
      reject
    );
  });
}
