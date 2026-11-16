import { config } from './core/config.js';
import { migrate } from './core/db.js';
import { seedDemo } from './core/seed.js';
import { startScheduler } from './core/scheduler.js';
import { startChannels } from './modules/notifications/index.js';
import { app } from './app.js';

migrate();
if (config.seedDemo) seedDemo();
startScheduler();
startChannels();

app.listen(config.port, () => {
  console.log(`[server] http://localhost:${config.port}`);
});
