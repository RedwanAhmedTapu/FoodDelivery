const catchAsync = require('../../utils/catchAsync');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const service = require('./wallet.service');

function ownerTypeForRole(role) {
  if (role === 'SHOP_OWNER') return 'SHOP_OWNER';
  if (role === 'DELIVERY_BOY') return 'DELIVERY_BOY';
  throw ApiError.forbidden('Only shop owners and delivery riders have a wallet');
}

const getMyWallet = catchAsync(async (req, res) => {
  const wallet = await service.getSummary(ownerTypeForRole(req.user.role), req.user._id);
  ApiResponse.success(res, { message: 'Wallet fetched', data: wallet });
});

const getMyTransactions = catchAsync(async (req, res) => {
  const { items, meta } = await service.listTransactions(ownerTypeForRole(req.user.role), req.user._id, req.query);
  ApiResponse.success(res, { message: 'Transactions fetched', data: items, meta });
});

const createPayout = catchAsync(async (req, res) => {
  const payout = await service.requestPayout(ownerTypeForRole(req.user.role), req.user._id, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Payout requested', data: payout });
});

const getMyPayouts = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMyPayouts(ownerTypeForRole(req.user.role), req.user._id, req.query);
  ApiResponse.success(res, { message: 'Payouts fetched', data: items, meta });
});

const createRemittance = catchAsync(async (req, res) => {
  const remittance = await service.submitCodRemittance(req.user._id, req.body);
  ApiResponse.success(res, { statusCode: 201, message: 'Remittance submitted', data: remittance });
});

const getMyRemittances = catchAsync(async (req, res) => {
  const { items, meta } = await service.listMyRemittances(req.user._id, req.query);
  ApiResponse.success(res, { message: 'Remittances fetched', data: items, meta });
});

// --- Admin ---

const adminListPayouts = catchAsync(async (req, res) => {
  const { items, meta } = await service.listAllPayouts(req.query);
  ApiResponse.success(res, { message: 'Payouts fetched', data: items, meta });
});

const adminProcessPayout = catchAsync(async (req, res) => {
  const { action, adminNote } = req.body;
  const payout = await service.processPayout(req.params.id, req.user._id, action, adminNote);
  ApiResponse.success(res, { message: `Payout ${action === 'PAID' ? 'marked as paid' : 'rejected'}`, data: payout });
});

const adminListRemittances = catchAsync(async (req, res) => {
  const { items, meta } = await service.listAllRemittances(req.query);
  ApiResponse.success(res, { message: 'Remittances fetched', data: items, meta });
});

const adminConfirmRemittance = catchAsync(async (req, res) => {
  const remittance = await service.confirmRemittance(req.params.id, req.user._id);
  ApiResponse.success(res, { message: 'Remittance confirmed', data: remittance });
});

const adminRejectRemittance = catchAsync(async (req, res) => {
  const remittance = await service.rejectRemittance(req.params.id, req.user._id, req.body.note);
  ApiResponse.success(res, { message: 'Remittance rejected', data: remittance });
});

module.exports = {
  getMyWallet,
  getMyTransactions,
  createPayout,
  getMyPayouts,
  createRemittance,
  getMyRemittances,
  adminListPayouts,
  adminProcessPayout,
  adminListRemittances,
  adminConfirmRemittance,
  adminRejectRemittance,
};
