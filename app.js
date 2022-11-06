const express = require('express');
const morgan = require('morgan');
// npm i express-rate-limit
const rateLimit = require('express-rate-limit');
// npm i helmet  every express app should use this package for security
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

const AppError = require('./utils/appError');

const app = express();
const toursRouter = require('./routes/toursRoutes');
const usersRouter = require('./routes/usersRoutes');

// 1) Global middlewares
// set security http headers
app.use(helmet());

// development loging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}
// I used express-rate-limit to avoid many req from the same ip in a certain time to avoid deniel of service and brute force hacking attacks
// so this will limit the req for a certian ip for 100 req in 1 hour
// this will add X-RateLimit-Limit =100 &X-RateLimit-remail = remainig req  to the header
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP , pleace try again in an hour!',
});
// we want to allow this middleware only to requsets starts with /api
app.use('/api', limiter);

// body parser, reading data from body into req.body
// we can limit the req body to 10 kb to avoid attackers that send huge data in body to the server
app.use(express.json({ limit: '10kb' }));

// data sanitization against NoSQL query injection attack
app.use(mongoSanitize());

// data sanitization against XSS attack
app.use(xss());

// 3)Routes
app.use('/api/v1/tours', toursRouter);
app.use('/api/v1/users', usersRouter);

// this part is for error handling
app.all('*', (req, res, next) => {
  next(new AppError(`can't find ${req.originalUrl} on this server!`, 404));
});

app.use((err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  res.status(err.statusCode).json({
    status: err.status,
    message: err.message,
  });
});

module.exports = app;
