const PlatformSettings = require('./platformSettings.model');

async function getSettings() {
  return PlatformSettings.getSettings();
}

async function updateSettings(updates) {
  const allowed = ['platformFee', 'pointsRules', 'deliveryFee', 'taxPercentage', 'referral'];
  const payload = {};
  allowed.forEach((key) => {
    if (updates[key] !== undefined) payload[key] = updates[key];
  });

  const settings = await PlatformSettings.findOneAndUpdate(
    { key: 'GLOBAL' },
    { $set: payload },
    { new: true, upsert: true, runValidators: true }
  );
  return settings;
}

module.exports = { getSettings, updateSettings };
