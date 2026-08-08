const XLSX = require('xlsx');
const Food = require('../foods/food.model');
const FoodCategory = require('../foodCategories/foodCategory.model');
const Store = require('../stores/store.model');
const ApiError = require('../../utils/ApiError');
const { slugify } = require('../../utils/generateSlug');

const REQUIRED_COLUMNS = ['name', 'category', 'price'];

function parseFileToRows(file) {
  const ext = file.originalname.split('.').pop().toLowerCase();
  let workbook;

  if (ext === 'csv') {
    workbook = XLSX.read(file.buffer, { type: 'buffer', codepage: 65001 });
  } else {
    workbook = XLSX.read(file.buffer, { type: 'buffer' });
  }

  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet, { defval: '' });
}

function validateRow(row, index, categoryMap) {
  const errors = [];
  const rowNumber = index + 2; // header is row 1

  REQUIRED_COLUMNS.forEach((col) => {
    if (row[col] === undefined || row[col] === '') {
      errors.push(`Missing required field "${col}"`);
    }
  });

  const price = Number(row.price);
  if (row.price !== '' && Number.isNaN(price)) errors.push('price must be a number');
  if (!Number.isNaN(price) && price <= 0) errors.push('price must be greater than 0');

  if (row.discountPrice !== undefined && row.discountPrice !== '') {
    const discount = Number(row.discountPrice);
    if (Number.isNaN(discount)) errors.push('discountPrice must be a number');
  }

  const categoryKey = (row.category || '').toString().trim().toLowerCase();
  const category = categoryMap.get(categoryKey);
  if (!category) errors.push(`Unknown or inactive category "${row.category}"`);

  if (row.preparationTime !== undefined && row.preparationTime !== '') {
    const prep = Number(row.preparationTime);
    if (Number.isNaN(prep)) errors.push('preparationTime must be a number');
  }

  return { rowNumber, errors, category };
}

async function bulkUploadFoods(storeId, ownerId, file) {
  const store = await Store.findById(storeId);
  if (!store) throw ApiError.notFound('Store not found');
  if (store.ownerId.toString() !== ownerId.toString()) {
    throw ApiError.forbidden('You do not own this store');
  }

  const rows = parseFileToRows(file);
  if (!rows.length) throw ApiError.badRequest('Uploaded file contains no data rows');

  const categories = await FoodCategory.find({ isActive: true }).lean();
  const categoryMap = new Map(categories.map((c) => [c.name.trim().toLowerCase(), c]));

  const successRows = [];
  const failedRows = [];

  rows.forEach((row, index) => {
    const { rowNumber, errors, category } = validateRow(row, index, categoryMap);
    if (errors.length) {
      failedRows.push({ rowNumber, data: row, errors });
      return;
    }

    const price = Number(row.price);
    const discountPrice = row.discountPrice !== '' && row.discountPrice !== undefined ? Number(row.discountPrice) : null;

    successRows.push({
      storeId: store._id,
      ownerId: store.ownerId,
      categoryId: category._id,
      name: row.name.toString().trim(),
      slug: `${slugify(row.name.toString())}-${Date.now().toString(36)}-${rowNumber}`,
      description: row.description ? row.description.toString() : undefined,
      price,
      discountPrice,
      preparationTime: row.preparationTime ? Number(row.preparationTime) : undefined,
      isActive: true,
      availability: true,
    });
  });

  let insertedCount = 0;
  if (successRows.length) {
    const result = await Food.insertMany(successRows, { ordered: false });
    insertedCount = result.length;
  }

  return {
    totalRows: rows.length,
    successCount: insertedCount,
    failedCount: failedRows.length,
    failedRows,
  };
}

module.exports = { bulkUploadFoods };
