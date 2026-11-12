const mongoose = require('mongoose');

async function verifyDatabaseConnection() {
  if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
    throw new Error('MongoDB is not connected.');
  }

  await mongoose.connection.db.admin().ping();
  return true;
}

async function closeDatabaseConnection() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

module.exports = {
  verifyDatabaseConnection,
  closeDatabaseConnection
};

