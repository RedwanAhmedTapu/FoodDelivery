function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Generate a unique slug by appending a random suffix if a collision exists.
 * @param {import('mongoose').Model} model
 * @param {string} text
 * @param {string} field - field name to check uniqueness on (default 'slug')
 */
async function generateUniqueSlug(model, text, field = 'slug') {
  const base = slugify(text);
  let slug = base;
  let count = 0;

  // eslint-disable-next-line no-await-in-loop
  while (await model.exists({ [field]: slug })) {
    count += 1;
    slug = `${base}-${count}`;
  }
  return slug;
}

module.exports = { slugify, generateUniqueSlug };
