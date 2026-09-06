import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot } from "firebase/firestore";
import { db } from "../firebase.js";

const CACHE_KEY = "catalogoCache";

/**
 * Catálogo de productos activos, cacheado en localStorage. En un boliche con
 * wifi saturado, el listener de Firestore puede tardar o cortarse: mientras
 * tanto el cliente ve el último catálogo que se guardó localmente en vez de
 * una pantalla vacía.
 */
export function useCatalogo() {
  const [productos, setProductos] = useState(() => {
    try {
      const cache = localStorage.getItem(CACHE_KEY);
      return cache ? JSON.parse(cache) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const q = query(collection(db, "productos"), where("activo", "==", true), orderBy("orden", "asc"));
    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const lista = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setProductos(lista);
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify(lista));
        } catch {
          // localStorage lleno o deshabilitado: no es crítico, seguimos en memoria.
        }
      },
      () => {
        // Sin conexión: nos quedamos con lo que ya había en cache/estado.
      }
    );
    return unsubscribe;
  }, []);

  return productos;
}
