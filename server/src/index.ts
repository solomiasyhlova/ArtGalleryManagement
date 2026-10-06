import { createApp } from './app.js';
import { env } from './config/env.js';

createApp().listen(env.PORT, (error) => {
  if (error) {
    console.error(`Failed to start server on port ${env.PORT}:`, error.message);
    process.exit(1);
  }
  console.info(`Server listening on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
