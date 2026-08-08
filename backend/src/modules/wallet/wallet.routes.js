const router = require('express').Router();
const controller = require('./wallet.controller');
const { authenticate } = require('../../middleware/auth.middleware');
const { requireRole } = require('../../middleware/role.middleware');

/**
 * Tag: Wallet
 */

router.use(authenticate);

router.get('/me', requireRole('SHOP_OWNER', 'DELIVERY_BOY'), controller.getMyWallet);
router.get('/me/transactions', requireRole('SHOP_OWNER', 'DELIVERY_BOY'), controller.getMyTransactions);
router.post('/me/payouts', requireRole('SHOP_OWNER', 'DELIVERY_BOY'), controller.createPayout);
router.get('/me/payouts', requireRole('SHOP_OWNER', 'DELIVERY_BOY'), controller.getMyPayouts);

router.post('/me/cod-remittances', requireRole('DELIVERY_BOY'), controller.createRemittance);
router.get('/me/cod-remittances', requireRole('DELIVERY_BOY'), controller.getMyRemittances);

// Admin
router.get('/admin/payouts', requireRole('SUPER_ADMIN'), controller.adminListPayouts);
router.patch('/admin/payouts/:id', requireRole('SUPER_ADMIN'), controller.adminProcessPayout);
router.get('/admin/cod-remittances', requireRole('SUPER_ADMIN'), controller.adminListRemittances);
router.patch('/admin/cod-remittances/:id/confirm', requireRole('SUPER_ADMIN'), controller.adminConfirmRemittance);
router.patch('/admin/cod-remittances/:id/reject', requireRole('SUPER_ADMIN'), controller.adminRejectRemittance);

module.exports = router;
