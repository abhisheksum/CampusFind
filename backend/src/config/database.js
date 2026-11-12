const mongoose = require('mongoose');
const config = require('./env');
const { verifyDatabaseConnection } = require('../utils/database');

async function connectDatabase() {
  await mongoose.connect(config.mongodbUri, {
    serverSelectionTimeoutMS: 5000
  });
  await verifyDatabaseConnection();
  console.log('MongoDB connected');
}

module.exports = connectDatabase;

