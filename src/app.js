const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

app.get('/', (req, res) => {
   res.json({ message: 'Server is working!' });
});

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

module.exports = app;