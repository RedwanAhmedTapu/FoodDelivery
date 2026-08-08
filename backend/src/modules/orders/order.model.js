const mongoose = require('mongoose');
const { Schema } = mongoose;

const ORDER_STATUSES = [
  'PENDING',
  'ACCEPTED',
  'PREPARING',
  'READY_FOR_PICKUP',
  'ASSIGNED_TO_DELIVERY',
  'PICKED_UP',
  'ON_THE_WAY',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
];

const orderItemSchema = new Schema(
  {
    foodId: { type: Schema.Types.ObjectId, ref: 'Food', required: true },
    name: { type: String, required: true }, // snapshot
    unitPrice: { type: Number, required: true }, // snapshot, incl. variant modifier
    quantity: { type: Number, required: true, min: 1 },
    variant: {
      name: String,
      priceModifier: Number,
    },
    addons: [
      {
        name: String,
        price: Number,
      },
    ],
    notes: String,
    lineTotal: { type: Number, required: true }, // (unitPrice + addons) * quantity
  },
  { _id: false }
);

const orderSchema = new Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    customerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    items: { type: [orderItemSchema], required: true },

    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    pointsUsed: { type: Number, default: 0 },
    pointDiscount: { type: Number, default: 0 },
    deliveryFee: { type: Number, default: 0 },
    platformFee: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, required: true },

    paymentMethod: { type: String, enum: ['COD', 'CARD', 'BKASH', 'NAGAD', 'SSLCOMMERZ', 'STRIPE'], default: 'COD' },
    paymentStatus: { type: String, enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'], default: 'PENDING' },
    orderStatus: { type: String, enum: ORDER_STATUSES, default: 'PENDING' },

    deliveryAddress: { type: String, required: true },
    deliveryLocation: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true },
    },
    deliveryBoyId: { type: Schema.Types.ObjectId, ref: 'DeliveryBoy', default: null },

    // --- Pickup verification (store confirms it's handing food to the
    // correct, assigned rider — not a random person) ---
    pickupPin: { type: String, default: null },
    pickupVerifiedAt: { type: Date, default: null },

    // --- Delivery verification (customer confirms the rider who showed up
    // is actually delivering THEIR order) — the OTP flow requested. Free:
    // shown in-app + pushed via Socket.IO, no SMS gateway involved. ---
    deliveryOtp: { type: String, default: null },
    deliveryOtpAttempts: { type: Number, default: 0 },
    deliveryVerifiedAt: { type: Date, default: null },

    // --- Dispatch (rider search/offer cascade) bookkeeping ---
    dispatchStatus: {
      type: String,
      enum: ['NOT_STARTED', 'SEARCHING', 'ASSIGNED', 'FAILED'],
      default: 'NOT_STARTED',
    },
    dispatchAttemptCount: { type: Number, default: 0 },

    referralCode: { type: String, default: null },
    notes: { type: String, maxlength: 500 },
    estimatedDeliveryTime: { type: Number, default: 30 }, // minutes

    placedAt: { type: Date, default: Date.now },
    acceptedAt: { type: Date, default: null },
    preparedAt: { type: Date, default: null },
    pickedUpAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    cancelledAt: { type: Date, default: null },
    cancelReason: { type: String, default: null },
  },
  { timestamps: true }
);

orderSchema.index({ customerId: 1 });
orderSchema.index({ storeId: 1 });
orderSchema.index({ ownerId: 1 });
orderSchema.index({ deliveryBoyId: 1 });
orderSchema.index({ orderStatus: 1 });
orderSchema.index({ createdAt: -1 });
orderSchema.index({ deliveryLocation: '2dsphere' });

module.exports = mongoose.model('Order', orderSchema);
module.exports.ORDER_STATUSES = ORDER_STATUSES;
