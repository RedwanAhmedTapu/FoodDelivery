const { z } = require('zod');

const coordinatesSchema = z.tuple([z.number(), z.number()]); // [lng, lat]

const createStoreSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  phone: z.string().min(6),
  email: z.string().email().optional(),
  address: z.string().min(3),
  coordinates: coordinatesSchema,
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
  deliveryRadius: z.number().positive().optional(),
  minimumOrder: z.number().min(0).optional(),
  estimatedDeliveryTime: z.number().positive().optional(),
});

const updateStoreSchema = createStoreSchema.partial();

const nearbyQuerySchema = z.object({
  lng: z.coerce.number(),
  lat: z.coerce.number(),
  radius: z.coerce.number().optional(), // km
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

module.exports = { createStoreSchema, updateStoreSchema, nearbyQuerySchema };
