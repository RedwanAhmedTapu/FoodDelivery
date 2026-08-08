const Report = require('./report.model');
const Order = require('../orders/order.model');
const ApiError = require('../../utils/ApiError');
const { getPagination, paginate } = require('../../utils/pagination');
const { uploadImage } = require('../../config/cloudinary');

async function createReport(customerId, payload, files = []) {
  const order = await Order.findById(payload.orderId);
  if (!order) throw ApiError.notFound('Order not found');
  if (order.customerId.toString() !== customerId.toString()) {
    throw ApiError.forbidden('You can only report your own orders');
  }

  const uploads = await Promise.all(
    files.map((file) => {
      const dataUri = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
      return uploadImage(dataUri, 'food-delivery/reports');
    })
  );

  return Report.create({
    orderId: order._id,
    customerId,
    storeId: order.storeId,
    deliveryBoyId: order.deliveryBoyId,
    reason: payload.reason,
    description: payload.description,
    images: uploads.map((u) => ({ url: u.url, publicId: u.publicId })),
  });
}

async function updateStatus(reportId, status, adminResponse) {
  const report = await Report.findById(reportId);
  if (!report) throw ApiError.notFound('Report not found');
  report.status = status;
  if (adminResponse !== undefined) report.adminResponse = adminResponse;
  if (status === 'RESOLVED' || status === 'REJECTED') report.resolvedAt = new Date();
  await report.save();
  return report;
}

async function listMyReports(customerId, query) {
  const pagination = getPagination(query);
  return paginate(Report, { customerId }, pagination);
}

async function listAll(query) {
  const pagination = getPagination(query);
  const filter = {};
  if (query.status) filter.status = query.status;
  return paginate(Report, filter, pagination, { populate: [{ path: 'orderId customerId storeId' }] });
}

module.exports = { createReport, updateStatus, listMyReports, listAll };
