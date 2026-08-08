const cron = require('node-cron');
const { sweepExpiredSubscriptions } = require('../modules/subscriptions/subscription.service');
const { sweepTimedOutOffers } = require('../modules/dispatch/dispatch.service');

/**
 * All scheduled background work lives here. Each job logs only when it
 * actually did something, and never lets one failing job crash the process
 * or block the others.
 */
function registerCronJobs() {
  // Every 15 minutes: deactivate stores whose subscription period has ended.
  cron.schedule('*/15 * * * *', async () => {
    try {
      const count = await sweepExpiredSubscriptions();
      if (count > 0) {
        // eslint-disable-next-line no-console
        console.log(`[cron] subscriptions: deactivated ${count} store(s) with an expired subscription`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cron] subscription sweep failed:', err.message);
    }
  });

  // Every 10 seconds: cascade any dispatch offer whose response window has
  // passed to the next-ranked rider. Frequent on purpose — this is what
  // keeps the "rider didn't answer in 20s -> try the next one" promise.
  cron.schedule('*/10 * * * * *', async () => {
    try {
      const count = await sweepTimedOutOffers();
      if (count > 0) {
        // eslint-disable-next-line no-console
        console.log(`[cron] dispatch: cascaded ${count} timed-out offer(s) to the next rider`);
      }
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('[cron] dispatch timeout sweep failed:', err.message);
    }
  });

  // eslint-disable-next-line no-console
  console.log('[cron] Background jobs registered: subscription sweep (15m), dispatch timeout sweep (10s)');
}

module.exports = { registerCronJobs };
