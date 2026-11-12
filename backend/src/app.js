const cors = require('cors');
const cookieParser = require('cookie-parser');
const express = require('express');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config/env');
const errorHandler = require('./middleware/errorHandler');
const authRoutes = require('./routes/auth.routes');
const healthRoutes = require('./routes/health.routes');
const reportRoutes = require('./routes/report.routes');
const matchesRoutes = require('./routes/matches.routes');
const claimRoutes = require('./routes/claim.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: config.clientUrl,
    credentials: true
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(mongoSanitize());
app.use(morgan(config.nodeEnv === 'production' ? 'combined' : 'dev'));

app.get('/', (_request, response) => {
  response.json({
    success: true,
    message: 'Smart Campus Lost-and-Found Portal API'
  });
});

app.use('/api/v1/health', healthRoutes);
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/reports', reportRoutes);
app.use('/api/v1/matches', matchesRoutes);
app.use('/api/v1/claims', claimRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/admin', adminRoutes);

app.use((request, response) => {
  response.status(404).json({
    success: false,
    error: {
      code: 'ROUTE_NOT_FOUND',
      message: `Route not found: ${request.method} ${request.originalUrl}`
    }
  });
});

app.use(errorHandler);

module.exports = app;

