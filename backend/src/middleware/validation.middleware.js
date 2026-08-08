const ApiError = require('../utils/ApiError');

/**
 * Validate req.body / req.query / req.params against a Zod schema map.
 * Usage: validate({ body: createStoreSchema, query: listQuerySchema })
 */
function validate(schemas) {
  return (req, res, next) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query);
      if (schemas.params) req.params = schemas.params.parse(req.params);
      next();
    } catch (err) {
      const errors = err.errors
        ? err.errors.map((e) => `${e.path.join('.')}: ${e.message}`)
        : [err.message];
      next(ApiError.badRequest('Validation failed', errors));
    }
  };
}

module.exports = { validate };
