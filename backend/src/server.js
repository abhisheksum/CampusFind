const app = require('./app');
const config = require('./config/env');
const connectDatabase = require('./config/database');

async function startServer() {
  try {
    await connectDatabase();

    app.listen(config.port, () => {
      console.log(`API server listening on http://localhost:${config.port}`);
    });
  } catch (error) {
    console.error('Unable to start API server:', error.message);
    process.exit(1);
  }
}

startServer();

