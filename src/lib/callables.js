import { httpsCallable } from "firebase/functions";
import { functions } from "../firebase.js";

export const crearPedido = httpsCallable(functions, "crearPedido");
export const iniciarPagoMercadoPago = httpsCallable(functions, "iniciarPagoMercadoPago");
export const verificarPagoPedido = httpsCallable(functions, "verificarPagoPedido");
export const confirmarEntrega = httpsCallable(functions, "confirmarEntrega");
export const confirmarPagoEfectivo = httpsCallable(functions, "confirmarPagoEfectivo");
export const loginStaff = httpsCallable(functions, "loginStaff");
export const crearUsuarioStaff = httpsCallable(functions, "crearUsuarioStaff");
export const cambiarPinStaff = httpsCallable(functions, "cambiarPinStaff");
export const eliminarUsuarioStaff = httpsCallable(functions, "eliminarUsuarioStaff");
