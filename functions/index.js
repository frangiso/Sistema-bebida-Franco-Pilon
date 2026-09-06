const { crearPedido } = require("./src/crearPedido");
const { confirmarEntrega } = require("./src/confirmarEntrega");
const { confirmarPagoEfectivo } = require("./src/confirmarPagoEfectivo");
const { webhookMercadoPago } = require("./src/webhookMercadoPago");
const { limpiarCodigosVencidos } = require("./src/limpiarCodigosVencidos");
const { loginStaff } = require("./src/loginStaff");
const { sincronizarRolStaff } = require("./src/sincronizarRolStaff");

module.exports = {
  crearPedido,
  confirmarEntrega,
  confirmarPagoEfectivo,
  webhookMercadoPago,
  limpiarCodigosVencidos,
  loginStaff,
  sincronizarRolStaff,
};
