
import dns from 'node:dns';

dns.setServers(['1.1.1.1']);

import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';

async function start() {
  try {
    await connectDB();
    const app = createApp();

    app.listen(env.port, () => {
      console.log(`ShopSphere API running on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
}

start();

