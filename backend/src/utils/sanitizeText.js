/**
 * Strip any HTML tags / script content from user-supplied text.
 * Used for store customization fields to prevent stored XSS,
 * since shop owners must not be able to inject arbitrary HTML/JS.
 */
function sanitizeText(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .trim();
}

function sanitizeObjectStrings(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeText(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObjectStrings);
  if (typeof obj === 'object') {
    const result = {};
    Object.entries(obj).forEach(([key, value]) => {
      result[key] = sanitizeObjectStrings(value);
    });
    return result;
  }
  return obj;
}

module.exports = { sanitizeText, sanitizeObjectStrings };
