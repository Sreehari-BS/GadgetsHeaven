const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on('connected', () => {
  console.log('Successfully connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Failed to connect to MongoDB');
  console.error(err);
});

const express = require('express');
const { render } = require('ejs');

const app = express();

// for useRoutes
const userRoute = require('./routes/userRoute');
const adminRoute = require('./routes/adminRoute');

app.use('/', userRoute);
app.use('/admin', adminRoute);

app.listen(5000, () => {
  console.log('Server is running at http://localhost:5000');
});
