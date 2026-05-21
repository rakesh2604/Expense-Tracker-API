const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const errorHandler = require('./middleware/error');
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const transactionRoutes = require('./routes/transaction');
const categoryRoutes = require('./routes/category');
const analyticsRoutes = require('./routes/analytics');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.redirect('/docs'));
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use('/health', healthRoutes);
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/transactions', transactionRoutes);
app.use('/categories', categoryRoutes);
app.use('/analytics', analyticsRoutes);

app.use(errorHandler);

module.exports = app;
