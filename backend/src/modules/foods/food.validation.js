const { z } = require('zod');

const variantSchema = z.object({
  name: z.string().min(1),
  priceModifier: z.number().default(0),
});

const addonSchema = z.object({
  name: z.string().min(1),
  price: z.number().min(0).default(0),
});

const createFoodSchema = z.object({
  storeId: z.string().min(1),
  categoryId: z.string().min(1),
  name: z.string().min(2),
  description: z.string().optional(),
  price: z.number().positive(),
  discountPrice: z.number().positive().optional(),
  preparationTime: z.number().positive().optional(),
  ingredients: z.array(z.string()).optional(),
  allergens: z.array(z.string()).optional(),
  calories: z.number().optional(),
  tags: z.array(z.string()).optional(),
  variants: z.array(variantSchema).optional(),
  addons: z.array(addonSchema).optional(),
  stock: z.number().int().optional(),
});

const updateFoodSchema = createFoodSchema.partial().omit({ storeId: true });

const searchQuerySchema = z.object({
  search: z.string().optional(),
  categoryId: z.string().optional(),
  storeId: z.string().optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  minRating: z.coerce.number().optional(),
  sortBy: z.enum(['popularity', 'price_asc', 'price_desc', 'rating', 'newest']).optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
});

module.exports = { createFoodSchema, updateFoodSchema, searchQuerySchema };
