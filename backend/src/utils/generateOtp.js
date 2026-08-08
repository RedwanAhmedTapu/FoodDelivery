const crypto = require('crypto');

/** Generates a numeric OTP of the given length (default 4 digits). */
function generateOtp(length = 4) {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return crypto.randomInt(min, max + 1).toString();
}

module.exports = { generateOtp };
