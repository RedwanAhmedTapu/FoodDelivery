const http = require('http');
const app = require('./app');
const connectDB = require('./config/db');
const { initSockets } = require('./sockets');
const env = require('./config/env');
const { registerCronJobs } = require('./jobs/cron');

async function start() {
  await connectDB();

  const httpServer = http.createServer(app);
  initSockets(httpServer);

  httpServer.listen(env.PORT, () => {
    // eslint-disable-next-line no-console
    console.log(`[server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
    // eslint-disable-next-line no-console
    console.log(`[server] API docs available at http://localhost:${env.PORT}/api-docs`);
  });

  registerCronJobs();

  process.on('unhandledRejection', (err) => {
    // eslint-disable-next-line no-console
    console.error('[server] Unhandled rejection:', err);
    httpServer.close(() => process.exit(1));
  });
}

start();
