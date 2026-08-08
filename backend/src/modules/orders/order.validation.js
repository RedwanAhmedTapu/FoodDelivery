const { z } = require('zod');

const createOrderSchema = z.object({
  deliveryAddress: z.string().min(3),
  deliveryCoordinates: z.tuple([z.number(), z.number()]),
  paymentMethod: z.enum(['COD', 'CARD', 'BKASH', 'NAGAD', 'SSLCOMMERZ', 'STRIPE']).optional(),
  pointsToRedeem: z.number().min(0).optional(),
  referralCode: z.string().optional(),
  notes: z.string().max(500).optional(),
});

const updateStatusSchema = z.object({
  // PICKED_UP is set only via the pickup-PIN endpoint, DELIVERED only via
  // the delivery-OTP endpoint — both are excluded here so the API surface
  // itself documents that those two require verification, not a bare PATCH.
  status: z.enum([
    'ACCEPTED',
    'REJECTED',
    'PREPARING',
    'READY_FOR_PICKUP',
    'ASSIGNED_TO_DELIVERY',
    'ON_THE_WAY',
    'CANCELLED',
  ]),
});

const cancelOrderSchema = z.object({
  reason: z.string().min(3).max(500),
});

const verifyDeliverySchema = z.object({
  otp: z.string().min(3).max(10),
});

module.exports = { createOrderSchema, updateStatusSchema, cancelOrderSchema, verifyDeliverySchema };
