const config = require('../config/env');

function getHealth(_request, response) {
  response.status(200).json({
    success: true,
    data: {
      status: 'ok',
      environment: config.nodeEnv,
      timestamp: new Date().toISOString()
    }
  });
}

module.exports = { getHealth };

