const mongoose = require('mongoose');

const { Schema } = mongoose;

const WALLET_OWNER_TYPES = ['SHOP_OWNER', 'DELIVERY_BOY'];

const walletSchema = new Schema(
  {
    // ownerId is always the User document's _id — the same id already used
    // everywhere for auth (req.user._id) — NOT the ShopOwnerProfile or
    // DeliveryBoy profile _id. This keeps every wallet lookup a single
    // indexed query straight from the authenticated request, with no need
    // to resolve a profile doc first.
    ownerType: { type: String, enum: WALLET_OWNER_TYPES, required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    // Can go negative for DELIVERY_BOY wallets: cash-on-delivery collections
    // that aren't the rider's own delivery fee are tracked as a debt against
    // future earnings until the rider remits that cash (see CodRemittance).
    // SHOP_OWNER wallets are never allowed to go negative.
    balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

walletSchema.index({ ownerType: 1, ownerId: 1 }, { unique: true });

module.exports = mongoose.model('Wallet', walletSchema);
module.exports.WALLET_OWNER_TYPES = WALLET_OWNER_TYPES;
