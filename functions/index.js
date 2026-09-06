const { crearPedido } = require("./src/crearPedido");
const { confirmarEntrega } = require("./src/confirmarEntrega");
const { confirmarPagoEfectivo } = require("./src/confirmarPagoEfectivo");
const { webhookMercadoPago } = require("./src/webhookMercadoPago");
const { limpiarCodigosVencidos } = require("./src/limpiarCodigosVencidos");
const { loginStaff } = require("./src/loginStaff");
const { sincronizarRolStaff } = require("./src/sincronizarRolStaff");
const { iniciarPagoMercadoPago } = require("./src/iniciarPagoMercadoPago");
const { verificarPagoPedido } = require("./src/verificarPagoPedido");
const { crearUsuarioStaff } = require("./src/crearUsuarioStaff");
const { cambiarPinStaff } = require("./src/cambiarPinStaff");
const { eliminarUsuarioStaff } = require("./src/eliminarUsuarioStaff");

module.exports = {
  crearPedido,
  confirmarEntrega,
  confirmarPagoEfectivo,
  webhookMercadoPago,
  limpiarCodigosVencidos,
  loginStaff,
  sincronizarRolStaff,
  iniciarPagoMercadoPago,
  verificarPagoPedido,
  crearUsuarioStaff,
  cambiarPinStaff,
  eliminarUsuarioStaff,
};
