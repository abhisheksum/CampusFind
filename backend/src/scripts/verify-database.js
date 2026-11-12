const connectDatabase = require('../config/database');
const { closeDatabaseConnection, verifyDatabaseConnection } = require('../utils/database');

async function verify() {
  try {
    await connectDatabase();
    await verifyDatabaseConnection();
    console.log('MongoDB connectivity verified.');
  } catch (error) {
    console.error('MongoDB connectivity verification failed:', error.message);
    process.exitCode = 1;
  } finally {
    await closeDatabaseConnection();
  }
}

verify();

