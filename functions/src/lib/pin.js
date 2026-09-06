const bcrypt = require("bcryptjs");

const SALT_ROUNDS = 10;

function hashearPin(pin) {
  return bcrypt.hash(pin, SALT_ROUNDS);
}

module.exports = { hashearPin };
