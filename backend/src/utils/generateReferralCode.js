const crypto = require('crypto');

function generateReferralCode(length = 8) {
  return crypto.randomBytes(length).toString('hex').slice(0, length).toUpperCase();
}

async function generateUniqueReferralCode(model, field = 'code', length = 8) {
  let code = generateReferralCode(length);
  // eslint-disable-next-line no-await-in-loop
  while (await model.exists({ [field]: code })) {
    code = generateReferralCode(length);
  }
  return code;
}

module.exports = { generateReferralCode, generateUniqueReferralCode };
